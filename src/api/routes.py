from datetime import datetime, timezone, timedelta
import hashlib
import secrets
from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import or_
import cloudinary.uploader
from api.models import (
    db,
    utc_now,
    Workshop,
    User,
    Employee,
    Customer,
    Vehicle,
    Service,
    ServiceComment,
    ServiceStatusLog,
    PasswordResetToken
)


api = Blueprint("api", __name__)
CORS(api)

bcrypt = Bcrypt()


###---------------OPTIONS----------------------

FUEL_TYPES = [
    "gasoline",
    "diesel",
    "hybrid",
    "plug_in_hybrid",
    "electric",
    "lpg"
]

SERVICE_TYPES = [
    "repair",
    "maintenance",
    "diagnostic",
    "inspection",
    "bodywork",
    "painting",
    "cleaning",
    "detailing",
    "other"
]

SERVICE_STATUSES = [
    "pending",
    "diagnosis",
    "budget_pending",
    "waiting_parts",
    "in_repair",
    "ready_to_deliver",
    "delivered",
    "cancelled"
]

SERVICE_PRIORITIES = [
    "low",
    "normal",
    "high",
    "urgent"
]

COMMENT_TYPES = [
    "note",
    "status_update",
    "admin_alert"
]


###---------------HELPERS----------------------

def error_response(message, status_code):

    return jsonify({
        "message": message,
        "error": message
    }), status_code


def get_current_user():

    current_user_id = get_jwt_identity()

    if not current_user_id:
        return None

    return db.session.get(User, int(current_user_id))


def get_current_employee(user):

    if not user:
        return None

    return user.employee


def get_current_workshop_id(user):

    employee = get_current_employee(user)

    if not employee:
        return None

    return employee.workshop_id


def get_current_workshop(user):

    employee = get_current_employee(user)

    if not employee:
        return None

    return employee.workshop


def is_admin(user):

    employee = get_current_employee(user)

    return employee is not None and employee.role == "admin" and employee.is_active


def is_mechanic(user):

    employee = get_current_employee(user)

    return employee is not None and employee.role == "mechanic" and employee.is_active


def parse_date(value):

    if not value:
        return None

    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_datetime(value):

    if not value:
        return None

    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def create_status_log(service, employee_id, new_status, note=None):

    status_log = ServiceStatusLog(
        service_id=service.id,
        from_status=service.status,
        to_status=new_status,
        employee_id=employee_id,
        note=note
    )

    service.status = new_status

    db.session.add(status_log)

    return status_log


def get_customer_or_error(customer_id, current_user, active_only=True):

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return None, error_response("Workshop not found for this user", 404)

    query = Customer.query.filter_by(
        id=customer_id,
        workshop_id=workshop_id
    )

    if active_only:
        query = query.filter_by(is_active=True)

    customer = query.first()

    if not customer:
        return None, error_response("Customer not found", 404)

    return customer, None


def get_vehicle_or_error(vehicle_id, current_user, active_only=True):

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return None, error_response("Workshop not found for this user", 404)

    query = Vehicle.query.filter_by(
        id=vehicle_id,
        workshop_id=workshop_id
    )

    if active_only:
        query = query.filter_by(is_active=True)

    vehicle = query.first()

    if not vehicle:
        return None, error_response("Vehicle not found", 404)

    return vehicle, None


def get_employee_or_error(employee_id, current_user, active_only=True):

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return None, error_response("Workshop not found for this user", 404)

    query = Employee.query.filter_by(
        id=employee_id,
        workshop_id=workshop_id
    )

    if active_only:
        query = query.filter_by(is_active=True)

    employee = query.first()

    if not employee:
        return None, error_response("Employee not found", 404)

    return employee, None


def get_service_or_error(service_id, current_user):

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return None, error_response("Workshop not found for this user", 404)

    service = Service.query.filter_by(
        id=service_id,
        workshop_id=workshop_id
    ).first()

    if not service:
        return None, error_response("Service not found", 404)

    return service, None



###------------OPTIONS ENDPOINT----------------------

@api.route("/options", methods=["GET"])
def get_options():

    return jsonify({
        "fuel_types": FUEL_TYPES,
        "service_types": SERVICE_TYPES,
        "service_statuses": SERVICE_STATUSES,
        "service_priorities": SERVICE_PRIORITIES,
        "comment_types": COMMENT_TYPES
    }), 200



###---------------REGISTER----------------------

@api.route("/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    company_name = (data.get("company_name") or "").strip()
    cif = (data.get("cif") or "").strip() or None

    address = data.get("address")
    city = data.get("city")
    postal_code = data.get("postal_code")

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    dni = data.get("dni")

    employee_phone = (
        data.get("employee_phone")
        or data.get("admin_phone")
        or data.get("phone")
    )

    user_email = data.get("user_email") or data.get("email")
    password = data.get("password")
    password_confirm = data.get("password_confirm")

    workshop_phone = data.get("workshop_phone") or employee_phone
    workshop_email = data.get("workshop_email") or user_email

    if not company_name:
        return error_response("company_name is required", 400)

    if not first_name or not last_name or not dni or not employee_phone:
        return error_response(
            "first_name, last_name, dni and employee_phone are required for the admin employee",
            400
        )

    if not user_email or not password:
        return error_response(
            "user_email and password are required",
            400
        )

    if password != password_confirm:
        return error_response("Passwords do not match", 400)

    existing_workshop_email = Workshop.query.filter_by(
        email=workshop_email
    ).first()

    if existing_workshop_email:
        return error_response(
            "A workshop with this email already exists",
            409
        )

    if cif:
        existing_workshop_cif = Workshop.query.filter_by(
            cif=cif
        ).first()

        if existing_workshop_cif:
            return error_response(
                "A workshop with this CIF already exists",
                409
            )

    existing_employee = Employee.query.filter_by(
        dni=dni
    ).first()

    if existing_employee:
        return error_response(
            "An employee with this DNI already exists",
            409
        )

    existing_user = User.query.filter_by(
        email=user_email
    ).first()

    if existing_user:
        return error_response(
            "A user with this email already exists",
            409
        )

    new_workshop = Workshop(
        company_name=company_name,
        cif=cif,
        phone=workshop_phone,
        email=workshop_email,
        address=address,
        city=city,
        postal_code=postal_code
    )

    db.session.add(new_workshop)
    db.session.flush()

    admin_employee = Employee(
        first_name=first_name,
        last_name=last_name,
        dni=dni,
        phone=employee_phone,
        role="admin",
        job_position="admin",
        workshop_id=new_workshop.id
    )

    db.session.add(admin_employee)
    db.session.flush()

    password_hash = bcrypt.generate_password_hash(
        password
    ).decode("utf-8")

    admin_user = User(
        email=user_email,
        password_hash=password_hash,
        employee_id=admin_employee.id
    )

    db.session.add(admin_user)
    db.session.commit()

    token = create_access_token(
        identity=str(admin_user.id),
        additional_claims={
            "role": admin_employee.role,
            "workshop_id": admin_employee.workshop_id,
            "employee_id": admin_employee.id
        }
    )

    return jsonify({
        "message": "Workshop created successfully",
        "token": token,
        "workshop": new_workshop.serialize(),
        "user": admin_user.serialize(),
        "employee": admin_employee.serialize()
    }), 201

###--------------- LOGIN----------------------

@api.route("/login", methods=["POST"])
def login():

    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return error_response("email and password are required", 400)

    user = User.query.filter_by(email=email).first()

    if not user:
        return error_response("Invalid email or password", 401)

    employee = user.employee

    if not employee:
        return error_response("This user account has no employee profile", 403)

    if not employee.is_active:
        return error_response("This employee account is inactive", 403)

    workshop = employee.workshop

    if not workshop:
        return error_response("Workshop not found", 404)

    if not workshop.is_active:
        return error_response("This workshop account is inactive", 403)

    is_valid_password = bcrypt.check_password_hash(user.password_hash, password)

    if not is_valid_password:
        return error_response("Invalid email or password", 401)

    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": employee.role,
            "workshop_id": employee.workshop_id,
            "employee_id": employee.id
        }
    )

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.serialize(),
        "employee": employee.serialize(),
        "workshop": workshop.serialize()
    }), 200

###---------------C CURRENT USER / SESSION----------------------

@api.route("/me", methods=["GET"])
@jwt_required()
def get_me():

    current_user = get_current_user()

    if not current_user:
        return error_response("User not found", 404)

    employee = current_user.employee

    if not employee:
        return error_response("Employee profile not found", 404)

    return jsonify({
        "user": current_user.serialize(),
        "employee": employee.serialize(),
        "workshop": employee.workshop.serialize() if employee.workshop else None
    }), 200


###---------------WORKSHOP----------------------


@api.route("/workshop", methods=["GET"])
@jwt_required()
def get_my_workshop():

    current_user = get_current_user()
    workshop = get_current_workshop(current_user)

    if not workshop:
        return error_response("Workshop not found", 404)

    return jsonify({
        "workshop": workshop.serialize()
    }), 200


@api.route("/workshop", methods=["PUT"])
@jwt_required()
def update_my_workshop():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can update workshop data", 403)

    workshop = get_current_workshop(current_user)

    if not workshop:
        return error_response("Workshop not found", 404)

    data = request.get_json() or {}

    if "email" in data and data.get("email") != workshop.email:
        existing_workshop = Workshop.query.filter(
            Workshop.email == data.get("email"),
            Workshop.id != workshop.id
        ).first()

        if existing_workshop:
            return error_response("A workshop with this email already exists", 409)

    editable_fields = [
        "company_name",
        "phone",
        "email",
        "address",
        "city",
        "postal_code"
    ]

    for field in editable_fields:
        if field in data:
            setattr(workshop, field, data[field])

    db.session.commit()

    return jsonify({
        "message": "Workshop updated successfully",
        "workshop": workshop.serialize()
    }), 200

###---------------MECHANICS GET----------------------

@api.route("/mechanics", methods=["GET"])
@jwt_required()
def get_mechanics():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can see mechanics", 403)

    workshop_id = get_current_workshop_id(current_user)

    mechanics = Employee.query.filter_by(
        workshop_id=workshop_id,
        role="mechanic",
        is_active=True
    ).all()

    return jsonify({
        "mechanics": [mechanic.serialize() for mechanic in mechanics]
    }), 200

###------------MECHANICS CREATE----------------------

@api.route("/mechanics", methods=["POST"])
@jwt_required()
def create_mechanic():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can create mechanics", 403)

    data = request.get_json() or {}

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    dni = data.get("dni")
    phone = data.get("phone")
    email = data.get("email")
    password = data.get("password")
    password_confirm = data.get("password_confirm")
    address = data.get("address")
    city = data.get("city")
    postal_code = data.get("postal_code")
    specialty = data.get("specialty")

    if not first_name or not last_name or not dni or not phone or not email or not password:
        return error_response("first_name, last_name, dni, phone, email and password are required", 400)

    if password != password_confirm:
        return error_response("Passwords do not match", 400)

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return error_response("A user with this email already exists", 409)

    existing_employee = Employee.query.filter_by(dni=dni).first()

    if existing_employee:
        return error_response("An employee with this DNI already exists", 409)

    workshop_id = get_current_workshop_id(current_user)

    mechanic_employee = Employee(
        first_name=first_name,
        last_name=last_name,
        dni=dni,
        phone=phone,
        address=address,
        city=city,
        postal_code=postal_code,
        role="mechanic",
        specialty=specialty,
        workshop_id=workshop_id
    )

    db.session.add(mechanic_employee)
    db.session.flush()

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    mechanic_user = User(
        email=email,
        password_hash=password_hash,
        employee_id=mechanic_employee.id
    )

    db.session.add(mechanic_user)
    db.session.commit()

    return jsonify({
        "message": "Mechanic created successfully",
        "user": mechanic_user.serialize(),
        "employee": mechanic_employee.serialize()
    }), 201
###---------------MECHANICS ID GETL----------------------

@api.route("/mechanics/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_mechanic_detail(employee_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can see mechanic details", 403)

    employee, error = get_employee_or_error(employee_id, current_user)

    if error:
        return error

    if employee.role != "mechanic":
        return error_response("Mechanic not found", 404)

    return jsonify({
        "mechanic": employee.serialize()
    }), 200

###---------------MECHANICS  ID UPDATE----------------------

@api.route("/mechanics/<int:employee_id>", methods=["PUT"])
@jwt_required()
def update_mechanic(employee_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can update mechanics", 403)

    employee, error = get_employee_or_error(employee_id, current_user)

    if error:
        return error

    if employee.role != "mechanic":
        return error_response("Mechanic not found", 404)

    data = request.get_json() or {}

    if "dni" in data and data.get("dni") != employee.dni:
        existing_employee = Employee.query.filter(
            Employee.dni == data.get("dni"),
            Employee.id != employee.id
        ).first()

        if existing_employee:
            return error_response("An employee with this DNI already exists", 409)

    editable_fields = [
        "first_name",
        "last_name",
        "dni",
        "phone",
        "address",
        "city",
        "postal_code",
        "specialty"
    ]

    for field in editable_fields:
        if field in data:
            setattr(employee, field, data[field])

    db.session.commit()

    return jsonify({
        "message": "Mechanic updated successfully",
        "mechanic": employee.serialize()
    }), 200

###---------------MECHANICS ID DEACTIVATE----------------------

@api.route("/mechanics/<int:employee_id>", methods=["DELETE"])
@jwt_required()
def delete_mechanic(employee_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can delete mechanics", 403)

    employee, error = get_employee_or_error(employee_id, current_user)

    if error:
        return error

    if employee.role != "mechanic":
        return error_response("Mechanic not found", 404)

    employee.is_active = False
    db.session.commit()

    return jsonify({
        "message": "Mechanic deactivated successfully"
    }), 200


###---------------VEHICLES GET---------------------

@api.route("/vehicles", methods=["GET"])
@jwt_required()
def get_vehicles():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can see vehicles", 403)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    vehicles = (
        Vehicle.query
        .join(Customer)
        .filter(
            Vehicle.workshop_id == workshop_id,
            Vehicle.is_active == True,
            Customer.is_active == True
        )
        .order_by(Vehicle.created_at.desc())
        .all()
    )

    return jsonify({
        "vehicles": [vehicle.serialize() for vehicle in vehicles]
    }), 200


#-------------VEHICLES: CREATE----------------------

@api.route("/vehicles", methods=["POST"])
@jwt_required()
def create_vehicle():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can create vehicles", 403)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    data = request.get_json() or {}

    customer_id = data.get("customer_id")
    plate = data.get("plate")
    vin = data.get("vin")

    brand = data.get("brand")
    model = data.get("model")
    version = data.get("version")
    year = data.get("year")

    fuel_type = data.get("fuel_type")
    power_hp = data.get("power_hp")
    engine_cc = data.get("engine_cc")
    color = data.get("color")

    mileage = data.get("mileage", 0)
    first_registration_date = data.get("first_registration_date")

    if not customer_id or not plate or not brand or not model or not fuel_type:
        return error_response("customer_id, plate, brand, model and fuel_type are required", 400)

    if fuel_type not in FUEL_TYPES:
        return jsonify({
            "message": "Invalid fuel_type",
            "error": "Invalid fuel_type",
            "allowed_values": FUEL_TYPES
        }), 400

    customer, error = get_customer_or_error(customer_id, current_user)

    if error:
        return error

    normalized_plate = plate.upper().strip()

    existing_vehicle = Vehicle.query.filter_by(plate=normalized_plate).first()

    if existing_vehicle:
        return error_response("A vehicle with this plate already exists", 409)

    normalized_vin = vin.upper().strip() if vin else None

    if normalized_vin:
        existing_vin = Vehicle.query.filter_by(vin=normalized_vin).first()

        if existing_vin:
            return error_response("A vehicle with this VIN already exists", 409)

    vehicle = Vehicle(
        customer_id=customer.id,
        workshop_id=workshop_id,
        plate=normalized_plate,
        vin=normalized_vin,
        brand=brand,
        model=model,
        version=version,
        year=year,
        fuel_type=fuel_type,
        power_hp=power_hp,
        engine_cc=engine_cc,
        color=color,
        mileage=mileage or 0,
        first_registration_date=parse_date(first_registration_date)
    )

    db.session.add(vehicle)
    db.session.commit()

    return jsonify({
        "message": "Vehicle created successfully",
        "vehicle": vehicle.serialize()
    }), 201


###------------ VEHICLES ID GETL----------------------

@api.route("/vehicles/<int:vehicle_id>", methods=["GET"])
@jwt_required()
def get_vehicle_detail(vehicle_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can see vehicle details", 403)

    vehicle, error = get_vehicle_or_error(vehicle_id, current_user)

    if error:
        return error

    return jsonify({
        "vehicle": vehicle.serialize()
    }), 200

##---------------VEHICLES:UPDATE----------------------

@api.route("/vehicles/<int:vehicle_id>", methods=["PUT"])
@jwt_required()
def update_vehicle(vehicle_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can update vehicles", 403)

    vehicle, error = get_vehicle_or_error(vehicle_id, current_user)

    if error:
        return error

    data = request.get_json() or {}

    if "fuel_type" in data and data.get("fuel_type") not in FUEL_TYPES:
        return jsonify({
            "message": "Invalid fuel_type",
            "error": "Invalid fuel_type",
            "allowed_values": FUEL_TYPES
        }), 400

    if "plate" in data and data.get("plate"):
        normalized_plate = data.get("plate").upper().strip()

        existing_vehicle_plate = Vehicle.query.filter(
            Vehicle.plate == normalized_plate,
            Vehicle.id != vehicle.id
        ).first()

        if existing_vehicle_plate:
            return error_response("A vehicle with this plate already exists", 409)

        vehicle.plate = normalized_plate

    if "vin" in data:
        normalized_vin = data.get("vin").upper().strip() if data.get("vin") else None

        if normalized_vin and normalized_vin != vehicle.vin:
            existing_vehicle_vin = Vehicle.query.filter(
                Vehicle.vin == normalized_vin,
                Vehicle.id != vehicle.id
            ).first()

            if existing_vehicle_vin:
                return error_response("A vehicle with this VIN already exists", 409)

        vehicle.vin = normalized_vin

    editable_fields = [
        "brand",
        "model",
        "version",
        "year",
        "fuel_type",
        "power_hp",
        "engine_cc",
        "color",
        "mileage"
    ]

    for field in editable_fields:
        if field in data:
            setattr(vehicle, field, data[field])

    if "first_registration_date" in data:
        vehicle.first_registration_date = parse_date(data.get("first_registration_date"))

    db.session.commit()

    return jsonify({
        "message": "Vehicle updated successfully",
        "vehicle": vehicle.serialize()
    }), 200


###---------------VEHICLES: DELETE --------------------

@api.route("/vehicles/<int:vehicle_id>", methods=["DELETE"])
@jwt_required()
def delete_vehicle(vehicle_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can delete vehicles", 403)

    vehicle, error = get_vehicle_or_error(vehicle_id, current_user)

    if error:
        return error

    vehicle.is_active = False
    db.session.commit()

    return jsonify({
        "message": "Vehicle deactivated successfully"
    }), 200


##---------------CUSTOMERS: SERIALIZER----------------------

# Customer helper
def serialize_customer_with_vehicles(customer):

    customer_data = customer.serialize()

    active_vehicles = []

    for vehicle in customer.vehicles:
        if vehicle.is_active:
            active_vehicles.append(vehicle)

    customer_data["vehicles_count"] = len(active_vehicles)

    customer_data["vehicles"] = [
        {
            "id": vehicle.id,
            "plate": vehicle.plate,
            "brand": vehicle.brand,
            "model": vehicle.model,
            "version": vehicle.version,
            "year": vehicle.year,
            "fuel_type": vehicle.fuel_type,
            "mileage": vehicle.mileage,
            "customer_id": vehicle.customer_id,
            "workshop_id": vehicle.workshop_id,
            "is_active": vehicle.is_active
        }
        for vehicle in active_vehicles
    ]

    return customer_data


###---------------CUSTOMERS GET--------------------

@api.route("/customers", methods=["GET"])
@jwt_required()
def get_customers():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can see customers", 403)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    customers = (
        Customer.query
        .filter_by(
            workshop_id=workshop_id,
            is_active=True
        )
        .order_by(Customer.created_at.desc())
        .all()
    )

    return jsonify({
        "customers": [
            serialize_customer_with_vehicles(customer)
            for customer in customers
        ]
    }), 200
   


#-------------CUSTOMERS CREATE----------------

@api.route("/customers", methods=["POST"])
@jwt_required()
def create_customer():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can create customers", 403)

    data = request.get_json() or {}

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    dni = data.get("dni")
    driving_license = data.get("driving_license")
    phone = data.get("phone")
    email = data.get("email")
    address = data.get("address")

    if not first_name or not last_name or not dni or not driving_license or not phone:
        return error_response("first_name, last_name, dni, driving_license and phone are required", 400)

    existing_customer_dni = Customer.query.filter_by(dni=dni).first()

    if existing_customer_dni:
        return error_response("A customer with this DNI already exists", 409)

    existing_customer_license = Customer.query.filter_by(driving_license=driving_license).first()

    if existing_customer_license:
        return error_response("A customer with this driving license already exists", 409)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    customer = Customer(
        first_name=first_name,
        last_name=last_name,
        dni=dni,
        driving_license=driving_license,
        phone=phone,
        email=email,
        address=address,
        workshop_id=workshop_id
    )

    db.session.add(customer)
    db.session.commit()

    return jsonify({
        "message": "Customer created successfully",
        "customer": serialize_customer_with_vehicles(customer)
    }), 201


##--------------CUSTOMERS GET----------------------

@api.route("/customers/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer_detail(customer_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can see customer details", 403)

    customer, error = get_customer_or_error(customer_id, current_user)

    if error:
        return error

    return jsonify({
        "customer": serialize_customer_with_vehicles(customer)
    }), 200


###---------------CUSTOMERS UPDATE----------------------

@api.route("/customers/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can update customers", 403)

    customer, error = get_customer_or_error(customer_id, current_user)

    if error:
        return error

    data = request.get_json() or {}

    if "dni" in data and data.get("dni") != customer.dni:
        existing_customer_dni = Customer.query.filter(
            Customer.dni == data.get("dni"),
            Customer.id != customer.id
        ).first()

        if existing_customer_dni:
            return error_response("A customer with this DNI already exists", 409)

    if "driving_license" in data and data.get("driving_license") != customer.driving_license:
        existing_customer_license = Customer.query.filter(
            Customer.driving_license == data.get("driving_license"),
            Customer.id != customer.id
        ).first()

        if existing_customer_license:
            return error_response("A customer with this driving license already exists", 409)

    editable_fields = [
        "first_name",
        "last_name",
        "dni",
        "driving_license",
        "phone",
        "email",
        "address"
    ]

    for field in editable_fields:
        if field in data:
            setattr(customer, field, data[field])

    db.session.commit()

    return jsonify({
        "message": "Customer updated successfully",
        "customer": serialize_customer_with_vehicles(customer)
    }), 200


##------------CUSTOMERS:DELETE----------------------

@api.route("/customers/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can delete customers", 403)

    customer, error = get_customer_or_error(customer_id, current_user)

    if error:
        return error

    customer.is_active = False
    db.session.commit()

    return jsonify({
        "message": "Customer deactivated successfully"
    }), 200

###---------------SERVICES---------------------------
###---------------SERVICES GET----------------------

@api.route("/services", methods=["GET"])
@jwt_required()
def get_services():

    current_user = get_current_user()

    if not is_admin(current_user) and not is_mechanic(current_user):
        return error_response("Only admin or mechanic users can see services", 403)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    query = Service.query.filter_by(workshop_id=workshop_id)

    if is_mechanic(current_user):
        current_employee = get_current_employee(current_user)

        if not current_employee:
            return error_response("Employee profile not found", 404)

        query = query.filter(
            or_(
                Service.employee_id == current_employee.id,
                Service.employee_id.is_(None)
            )
        )

    status = request.args.get("status")
    customer_id = request.args.get("customer_id")
    vehicle_id = request.args.get("vehicle_id")
    employee_id = request.args.get("employee_id")

    if status:
        if status not in SERVICE_STATUSES:
            return jsonify({
                "message": "Invalid status",
                "error": "Invalid status",
                "allowed_values": SERVICE_STATUSES
            }), 400

        query = query.filter_by(status=status)

    if customer_id:
        query = query.filter_by(customer_id=customer_id)

    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)

    if employee_id and is_admin(current_user):
        query = query.filter_by(employee_id=employee_id)

    services = (
        query
        .order_by(Service.created_at.desc())
        .all()
    )

    return jsonify({
        "services": [service.serialize() for service in services]
    }), 200


###---------------SERVICES CREATE----------------------

@api.route("/services", methods=["POST"])
@jwt_required()
def create_service():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can create services", 403)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    data = request.get_json() or {}

    title = data.get("title")
    description = data.get("description")
    service_type = data.get("service_type")
    status = data.get("status", "pending")
    priority = data.get("priority", "normal")

    customer_id = data.get("customer_id")
    vehicle_id = data.get("vehicle_id")
    employee_id = data.get("employee_id") or None

    entry_mileage = data.get("entry_mileage")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    observations = data.get("observations")

    if not title or not service_type or not customer_id or not vehicle_id:
        return error_response("title, service_type, customer_id and vehicle_id are required", 400)

    if service_type not in SERVICE_TYPES:
        return jsonify({
            "message": "Invalid service_type",
            "error": "Invalid service_type",
            "allowed_values": SERVICE_TYPES
        }), 400

    if status not in SERVICE_STATUSES:
        return jsonify({
            "message": "Invalid status",
            "error": "Invalid status",
            "allowed_values": SERVICE_STATUSES
        }), 400

    if priority not in SERVICE_PRIORITIES:
        return jsonify({
            "message": "Invalid priority",
            "error": "Invalid priority",
            "allowed_values": SERVICE_PRIORITIES
        }), 400

    customer, error = get_customer_or_error(customer_id, current_user)

    if error:
        return error

    vehicle, error = get_vehicle_or_error(vehicle_id, current_user)

    if error:
        return error

    if vehicle.customer_id != customer.id:
        return error_response("This vehicle does not belong to the selected customer", 400)

    assigned_employee = None

    if employee_id:
        assigned_employee, error = get_employee_or_error(employee_id, current_user)

        if error:
            return error

        if assigned_employee.role != "mechanic":
            return error_response("The assigned employee must be a mechanic", 400)

    service = Service(
        title=title,
        description=description,
        service_type=service_type,
        status=status,
        priority=priority,
        entry_mileage=entry_mileage,
        start_date=parse_datetime(start_date) if start_date else datetime.now(timezone.utc),
        end_date=parse_datetime(end_date) if end_date else None,
        observations=observations,
        workshop_id=workshop_id,
        customer_id=customer.id,
        vehicle_id=vehicle.id,
        employee_id=assigned_employee.id if assigned_employee else None
    )

    db.session.add(service)
    db.session.flush()

    current_employee = get_current_employee(current_user)

    if current_employee:
        status_log = ServiceStatusLog(
            service_id=service.id,
            from_status=None,
            to_status=service.status,
            employee_id=current_employee.id,
            note="Service created"
        )

        db.session.add(status_log)

    db.session.commit()

    return jsonify({
        "message": "Service created successfully",
        "service": service.serialize()
    }), 201


###---------------SERVICES ID GET----------------------

@api.route("/services/<int:service_id>", methods=["GET"])
@jwt_required()
def get_service_detail(service_id):

    current_user = get_current_user()

    if not is_admin(current_user) and not is_mechanic(current_user):
        return error_response("Only admin or mechanic users can see service details", 403)

    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        current_employee = get_current_employee(current_user)

        if not current_employee:
            return error_response("Employee profile not found", 404)

        if service.employee_id is not None and service.employee_id != current_employee.id:
            return error_response("You do not have permission to see this service", 403)

    return jsonify({
        "service": service.serialize()
    }), 200


##---------------SERVICES UPDATE----------------------

@api.route("/services/<int:service_id>", methods=["PUT"])
@jwt_required()
def update_service(service_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response(
            "Only admin users can update services",
            403
        )

    service, error = get_service_or_error(
        service_id,
        current_user
    )

    if error:
        return error

    data = request.get_json() or {}

    if "service_type" in data and data.get("service_type") not in SERVICE_TYPES:
        return jsonify({
            "message": "Invalid service_type",
            "error": "Invalid service_type",
            "allowed_values": SERVICE_TYPES
        }), 400

    if "status" in data and data.get("status") not in SERVICE_STATUSES:
        return jsonify({
            "message": "Invalid status",
            "error": "Invalid status",
            "allowed_values": SERVICE_STATUSES
        }), 400

    if "priority" in data and data.get("priority") not in SERVICE_PRIORITIES:
        return jsonify({
            "message": "Invalid priority",
            "error": "Invalid priority",
            "allowed_values": SERVICE_PRIORITIES
        }), 400

    customer = service.customer
    vehicle = service.vehicle

    if "customer_id" in data and data.get("customer_id"):
        customer, error = get_customer_or_error(
            data.get("customer_id"),
            current_user
        )

        if error:
            return error

    if "vehicle_id" in data and data.get("vehicle_id"):
        vehicle, error = get_vehicle_or_error(
            data.get("vehicle_id"),
            current_user
        )

        if error:
            return error

    if customer and vehicle and vehicle.customer_id != customer.id:
        return error_response(
            "This vehicle does not belong to the selected customer",
            400
        )

    if "employee_id" in data:
        employee_id = data.get("employee_id") or None

        if employee_id:
            assigned_employee, error = get_employee_or_error(
                employee_id,
                current_user
            )

            if error:
                return error

            if assigned_employee.role != "mechanic":
                return error_response(
                    "The assigned employee must be a mechanic",
                    400
                )

            service.employee_id = assigned_employee.id

        else:
            service.employee_id = None

    if "customer_id" in data and customer:
        service.customer_id = customer.id

    if "vehicle_id" in data and vehicle:
        service.vehicle_id = vehicle.id

    editable_fields = [
        "title",
        "description",
        "service_type",
        "priority",
        "entry_mileage",
        "observations"
    ]

    for field in editable_fields:
        if field in data:
            setattr(service, field, data[field])

    if "start_date" in data:
        if not data.get("start_date"):
            return error_response(
                "start_date cannot be empty",
                400
            )

        service.start_date = parse_datetime(
            data.get("start_date")
        )

    if "end_date" in data:
        service.end_date = (
            parse_datetime(data.get("end_date"))
            if data.get("end_date")
            else None
        )

    if "status" in data:
        new_status = data.get("status")

        if new_status != service.status:
            current_employee = get_current_employee(current_user)

            create_status_log(
                service=service,
                employee_id=(
                    current_employee.id
                    if current_employee
                    else None
                ),
                new_status=new_status,
                note=data.get("status_note")
            )

    db.session.commit()

    return jsonify({
        "message": "Service updated successfully",
        "service": service.serialize()
    }), 200


###---------------SERVICES STATUS UPDATE----------------------

@api.route("/services/<int:service_id>/status", methods=["PATCH"])
@jwt_required()
def update_service_status(service_id):

    current_user = get_current_user()

    if not is_admin(current_user) and not is_mechanic(current_user):
        return error_response("Only admin or mechanic users can update service status", 403)

    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    current_employee = get_current_employee(current_user)

    if not current_employee:
        return error_response("Employee profile not found", 404)

    if is_mechanic(current_user) and service.employee_id != current_employee.id:
        return error_response("You do not have permission to update this service", 403)

    data = request.get_json() or {}

    new_status = data.get("status")
    note = data.get("note")

    if not new_status:
        return error_response("status is required", 400)

    if new_status not in SERVICE_STATUSES:
        return jsonify({
            "message": "Invalid status",
            "error": "Invalid status",
            "allowed_values": SERVICE_STATUSES
        }), 400

    if new_status == service.status:
        return jsonify({
            "message": "Service already has this status",
            "service": service.serialize()
        }), 200

    create_status_log(
        service=service,
        employee_id=current_employee.id,
        new_status=new_status,
        note=note
    )

    db.session.commit()

    return jsonify({
        "message": "Service status updated successfully",
        "service": service.serialize()
    }), 200


###---------------SERVICES STATUS LOGS GET----------------------

@api.route("/services/<int:service_id>/status-logs", methods=["GET"])
@jwt_required()
def get_service_status_logs(service_id):

    current_user = get_current_user()

    if not is_admin(current_user) and not is_mechanic(current_user):
        return error_response(
            "Only admin or mechanic users can see service status logs",
            403
        )

    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        current_employee = get_current_employee(current_user)

        if not current_employee:
            return error_response(
                "Employee profile not found",
                404
            )

        if service.employee_id != current_employee.id:
            return error_response(
                "You do not have permission to see these logs",
                403
            )

    logs = (
        ServiceStatusLog.query
        .filter_by(service_id=service.id)
        .order_by(ServiceStatusLog.changed_at.asc())
        .all()
    )

    now = datetime.now(timezone.utc)
    status_history = []

    for index, log in enumerate(logs):
        entered_at = log.changed_at

        if entered_at.tzinfo is None:
            entered_at = entered_at.replace(
                tzinfo=timezone.utc
            )

        next_log = (
            logs[index + 1]
            if index + 1 < len(logs)
            else None
        )

        exited_at = (
            next_log.changed_at
            if next_log
            else None
        )

        if exited_at and exited_at.tzinfo is None:
            exited_at = exited_at.replace(
                tzinfo=timezone.utc
            )

        duration_end = exited_at or now

        duration_seconds = max(
            0,
            int(
                (duration_end - entered_at).total_seconds()
            )
        )

        log_data = log.serialize()

        log_data.update({
            "entered_at": entered_at.isoformat(),
            "exited_at": (
                exited_at.isoformat()
                if exited_at
                else None
            ),
            "duration_seconds": duration_seconds,
            "is_current": next_log is None
        })

        status_history.append(log_data)

    return jsonify({
        "status_logs": status_history
    }), 200

###---------------SERVICES CANCEL----------------------

@api.route("/services/<int:service_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_service(service_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response(
            "Only admin users can cancel services",
            403
        )

    service, error = get_service_or_error(
        service_id,
        current_user
    )

    if error:
        return error

    if service.status == "cancelled":
        return jsonify({
            "message": "Service is already cancelled",
            "service": service.serialize()
        }), 200

    current_employee = get_current_employee(current_user)

    if not current_employee:
        return error_response(
            "Employee profile not found",
            404
        )

    data = request.get_json() or {}
    reason = (data.get("reason") or "").strip()

    cancellation_note = (
        reason
        or "Service cancelled"
    )

    create_status_log(
        service=service,
        employee_id=current_employee.id,
        new_status="cancelled",
        note=cancellation_note
    )

    db.session.commit()

    return jsonify({
        "message": "Service cancelled successfully",
        "service": service.serialize()
    }), 200

###---------------SERVICES PERMANENT DELETE----------------------

@api.route("/services/<int:service_id>", methods=["DELETE"])
@jwt_required()
def permanently_delete_service(service_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response(
            "Only admin users can permanently delete services",
            403
        )

    service, error = get_service_or_error(
        service_id,
        current_user
    )

    if error:
        return error

    data = request.get_json(silent=True) or {}

    if data.get("confirm") is not True:
        return error_response(
            "confirm must be true to permanently delete a service",
            400
        )

    image_public_ids = [
        comment.image_public_id
        for comment in service.comments
        if comment.image_public_id
    ]

    try:
        db.session.delete(service)
        db.session.flush()

    except Exception:
        db.session.rollback()

        return error_response(
            "Service deletion failed",
            500
        )

    for image_public_id in image_public_ids:
        try:
            delete_result = cloudinary.uploader.destroy(
                image_public_id,
                resource_type="image",
                invalidate=True
            )

            if delete_result.get("result") not in ["ok", "not found"]:
                db.session.rollback()

                return error_response(
                    "Image deletion failed",
                    500
                )

        except Exception:
            db.session.rollback()

            return error_response(
                "Image deletion failed",
                500
            )

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return error_response(
            "Service deletion failed",
            500
        )

    return jsonify({
        "message": "Service permanently deleted successfully"
    }), 200
###----------SERVICE COMMENTS GET---------------------

@api.route("/services/<int:service_id>/comments", methods=["GET"])
@jwt_required()
def get_service_comments(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if not employee:
            return error_response("Employee profile not found", 404)

        if service.employee_id is not None and service.employee_id != employee.id:
            return error_response("You do not have permission to access these comments", 403)

    comments = (
        ServiceComment.query
        .filter_by(service_id=service.id)
        .order_by(ServiceComment.created_at.desc())
        .all()
    )

    return jsonify({
        "comments": [comment.serialize() for comment in comments]
    }), 200

###--------------- SERVICE COMMENTS CREATE -------------

@api.route("/services/<int:service_id>/comments", methods=["POST"])
@jwt_required()
def create_service_comment(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    current_employee = get_current_employee(current_user)

    if not current_employee:
        return error_response("Employee profile not found", 404)

    if is_mechanic(current_user):
        if service.employee_id != current_employee.id:
            return error_response("You do not have permission to comment on this service", 403)


    data = request.form if request.form else (request.get_json(silent=True) or {})

    comment_text = data.get("comment", "").strip()
    comment_type = data.get("comment_type", "note")
    image = request.files.get("image")

    if not comment_text:
        return error_response("comment is required", 400)

    if comment_type not in COMMENT_TYPES:
        return jsonify({
            "message": "Invalid comment_type",
            "error": "Invalid comment_type",
            "allowed_values": COMMENT_TYPES
        }), 400

    image_url = None
    image_public_id = None

    if image and image.filename:
        if not image.mimetype.startswith("image/"):
            return error_response("Only image files are allowed", 400)

        try:
            upload_result = cloudinary.uploader.upload(
                image,
                folder=f"workshop-app/services/{service.id}/comments",
                resource_type="image"
            )

            image_url = upload_result.get("secure_url")
            image_public_id = upload_result.get("public_id")

        except Exception:
            return error_response("Image upload failed", 500)

    comment = ServiceComment(
        service_id=service.id,
        employee_id=current_employee.id,
        comment=comment_text,
        comment_type=comment_type,
        image_url=image_url,
        image_public_id=image_public_id
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        "message": "Comment created successfully",
        "comment": comment.serialize()
    }), 201

###--------------- SERVICE COMMENTS UPDATE -------------

@api.route(
    "/services/<int:service_id>/comments/<int:comment_id>",
    methods=["PATCH"]
)
@jwt_required()
def update_service_comment(service_id, comment_id):

    current_user = get_current_user()

    if not is_admin(current_user) and not is_mechanic(current_user):
        return error_response(
            "Only admin or mechanic users can update comments",
            403
        )

    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    current_employee = get_current_employee(current_user)

    if not current_employee:
        return error_response(
            "Employee profile not found",
            404
        )

    if is_mechanic(current_user) and service.employee_id != current_employee.id:
        return error_response(
            "You do not have permission to access this service",
            403
        )

    comment = ServiceComment.query.filter_by(
        id=comment_id,
        service_id=service.id
    ).first()

    if not comment:
        return error_response(
            "Comment not found",
            404
        )

    if is_mechanic(current_user) and comment.employee_id != current_employee.id:
        return error_response(
            "You can only edit your own comments",
            403
        )

    data = request.get_json() or {}

    if "comment" not in data and "comment_type" not in data:
        return error_response(
            "comment or comment_type is required",
            400
        )

    if "comment" in data:
        comment_text = (data.get("comment") or "").strip()

        if not comment_text:
            return error_response(
                "comment cannot be empty",
                400
            )

        comment.comment = comment_text

    if "comment_type" in data:
        comment_type = data.get("comment_type")

        if comment_type not in COMMENT_TYPES:
            return jsonify({
                "message": "Invalid comment_type",
                "error": "Invalid comment_type",
                "allowed_values": COMMENT_TYPES
            }), 400

        comment.comment_type = comment_type

    comment.updated_at = utc_now()

    db.session.commit()

    return jsonify({
        "message": "Comment updated successfully",
        "comment": comment.serialize()
    }), 200

###--------------- SERVICE COMMENTS DELETE -------------

@api.route(
    "/services/<int:service_id>/comments/<int:comment_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_service_comment(service_id, comment_id):

    current_user = get_current_user()

    if not is_admin(current_user) and not is_mechanic(current_user):
        return error_response(
            "Only admin or mechanic users can delete comments",
            403
        )

    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    current_employee = get_current_employee(current_user)

    if not current_employee:
        return error_response(
            "Employee profile not found",
            404
        )

    if is_mechanic(current_user) and service.employee_id != current_employee.id:
        return error_response(
            "You do not have permission to access this service",
            403
        )

    comment = ServiceComment.query.filter_by(
        id=comment_id,
        service_id=service.id
    ).first()

    if not comment:
        return error_response(
            "Comment not found",
            404
        )

    if is_mechanic(current_user) and comment.employee_id != current_employee.id:
        return error_response(
            "You can only delete your own comments",
            403
        )

    if comment.image_public_id:
        try:
            delete_result = cloudinary.uploader.destroy(
                comment.image_public_id,
                resource_type="image",
                invalidate=True
            )

            if delete_result.get("result") not in ["ok", "not found"]:
                return error_response(
                    "Image deletion failed",
                    500
                )

        except Exception:
            return error_response(
                "Image deletion failed",
                500
            )

    db.session.delete(comment)
    db.session.commit()

    return jsonify({
        "message": "Comment deleted successfully"
    }), 200

##------------COMMENTS: NOTIFY ADMIN---------------

@api.route("/services/<int:service_id>/notify-admin", methods=["POST"])
@jwt_required()
def notify_admin(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    current_employee = get_current_employee(current_user)

    if not current_employee:
        return error_response("Employee profile not found", 404)

    if is_mechanic(current_user):
        if service.employee_id != current_employee.id:
            return error_response("You do not have permission to notify admin about this service", 403)

    data = request.get_json() or {}
    message = data.get("message")

    if not message:
        return error_response("message is required", 400)

    comment = ServiceComment(
        service_id=service.id,
        employee_id=current_employee.id,
        comment=message,
        comment_type="admin_alert"
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        "message": "Admin notified successfully",
        "comment": comment.serialize()
    }), 201


##-------------MECHANIC DASHBOARD------------------

@api.route("/mechanic/services", methods=["GET"])
@jwt_required()
def get_my_mechanic_services():

    current_user = get_current_user()

    if not is_mechanic(current_user):
        return error_response("Only mechanic users can access this endpoint", 403)

    employee = get_current_employee(current_user)

    if not employee:
        return error_response("Employee profile not found", 404)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    services = (
        Service.query
        .filter(
            Service.workshop_id == workshop_id,
            or_(
                Service.employee_id == employee.id,
                Service.employee_id.is_(None)
            )
        )
        .order_by(Service.created_at.desc())
        .all()
    )

    assigned_services = [
        service for service in services
        if service.employee_id == employee.id
    ]

    available_services = [
        service for service in services
        if service.employee_id is None
    ]

    in_repair_count = len([
        service for service in assigned_services
        if service.status == "in_repair"
    ])

    finished_count = len([
        service for service in assigned_services
        if service.status in ["ready_to_deliver", "delivered"]
    ])

    return jsonify({
        "services": [service.serialize() for service in services],
        "stats": {
            "assigned": len(assigned_services),
            "available": len(available_services),
            "in_repair": in_repair_count,
            "finished": finished_count
        }
    }), 200

##-------------ADMIN DASHBOARD----------------------

@api.route("/admin/dashboard", methods=["GET"])
@jwt_required()
def get_admin_dashboard():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can access this endpoint", 403)

    workshop_id = get_current_workshop_id(current_user)

    if not workshop_id:
        return error_response("Workshop not found for this user", 404)

    active_vehicles = (
        Vehicle.query
        .join(Customer)
        .filter(
            Vehicle.workshop_id == workshop_id,
            Vehicle.is_active == True,
            Customer.is_active == True
        )
        .count()
    )

    mechanics_count = Employee.query.filter_by(
        workshop_id=workshop_id,
        role="mechanic",
        is_active=True
    ).count()

    budget_pending = Service.query.filter_by(
        workshop_id=workshop_id,
        status="budget_pending"
    ).count()

    services = (
        Service.query
        .filter_by(workshop_id=workshop_id)
        .order_by(Service.created_at.desc())
        .all()
    )

    services_by_status = {}

    for status in SERVICE_STATUSES:
        services_by_status[status] = [
            service.serialize() for service in services
            if service.status == status
        ]

    return jsonify({
        "stats": {
            "active_vehicles": active_vehicles,
            "mechanics_count": mechanics_count,
            "budget_pending": budget_pending
        },
        "services_by_status": services_by_status
    }), 200

####-----------------------------###--------------------------
    
###-------------- FORGOT PASSWORD----------------------

@api.route("/forgot-password", methods=["POST"])
def forgot_password():

    data = request.get_json() or {}

    email = data.get("email")

    if not email:
        return error_response("email is required", 400)
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({
            "message": "If the email exists, a password reset link has been generated"
        }), 200

    now = datetime.now(timezone.utc)

    previous_tokens = PasswordResetToken.query.filter_by(
        user_id=user.id,
        used_at=None
    ).all()

    for previous_token in previous_tokens:
        previous_token.used_at = now

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now + timedelta(minutes=30)
    )

    db.session.add(reset_token)
    db.session.commit()

    return jsonify({
        "message": "Password reset token generated successfully",
        "reset_token": raw_token
    }), 200


###--------------RESET PASSWORD----------------------

@api.route("/reset-password", methods=["POST"])
def reset_password():

    data = request.get_json() or {}

    raw_token = data.get("token")
    password = data.get("password")
    password_confirm = data.get("password_confirm")

    if not raw_token or not password or not password_confirm:
        return error_response("token, password and password_confirm are required", 400)

    if password != password_confirm:
        return error_response("Passwords do not match", 400)

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    reset_token = PasswordResetToken.query.filter_by(
        token_hash=token_hash,
        used_at=None
    ).first()

    if not reset_token:
        return error_response("Invalid or expired reset token", 400)

    now = datetime.now(timezone.utc)

    expires_at = reset_token.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        reset_token.used_at = now
        db.session.commit()

        return error_response("Invalid or expired reset token", 400)

    user = User.query.get(reset_token.user_id)

    if not user:
        return error_response("User not found", 404)

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    user.password_hash = password_hash
    reset_token.used_at = now

    db.session.commit()

    return jsonify({
        "message": "Password updated successfully"
    }), 200

###---------------SERVICE ASSIGN TO ME----------------------

@api.route("/services/<int:service_id>/assign-to-me", methods=["PATCH"])
@jwt_required()
def assign_service_to_me(service_id):

    current_user = get_current_user()

    if not is_mechanic(current_user):
        return error_response("Only mechanics can assign services to themselves", 403)

    current_employee = get_current_employee(current_user)

    if not current_employee:
        return error_response("Employee profile not found", 404)

    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if service.employee_id is not None:
        return error_response("This service is already assigned", 409)

    service.employee_id = current_employee.id

    db.session.commit()

    return jsonify({
        "message": "Service assigned successfully",
        "service": service.serialize()
    }), 200
