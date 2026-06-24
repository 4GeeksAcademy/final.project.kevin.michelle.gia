from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from api.models import (
    db,
    Workshop,
    User,
    Employee,
    Customer,
    Vehicle,
    Service,
    ServiceComment,
    ServiceStatusLog
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


def get_customer_or_error(customer_id, current_user):

    workshop_id = get_current_workshop_id(current_user)

    customer = Customer.query.filter_by(
        id=customer_id,
        workshop_id=workshop_id
    ).first()

    if not customer:
        return None, error_response("Customer not found", 404)

    return customer, None


def get_vehicle_or_error(vehicle_id, current_user):

    workshop_id = get_current_workshop_id(current_user)

    vehicle = Vehicle.query.filter_by(
        id=vehicle_id,
        workshop_id=workshop_id
    ).first()

    if not vehicle:
        return None, error_response("Vehicle not found", 404)

    return vehicle, None


def get_employee_or_error(employee_id, current_user):

    workshop_id = get_current_workshop_id(current_user)

    employee = Employee.query.filter_by(
        id=employee_id,
        workshop_id=workshop_id
    ).first()

    if not employee:
        return None, error_response("Employee not found", 404)

    return employee, None


def get_service_or_error(service_id, current_user):

    workshop_id = get_current_workshop_id(current_user)

    service = Service.query.filter_by(
        id=service_id,
        workshop_id=workshop_id
    ).first()

    if not service:
        return None, error_response("Service not found", 404)

    return service, None


###---------------HELLO----------------------

@api.route("/hello", methods=["GET", "POST"])
def handle_hello():

    return jsonify({
        "message": "Hello from the workshop API"
    }), 200


###---------------OPTIONS ENDPOINT----------------------

@api.route("/options", methods=["GET"])
def get_options():

    return jsonify({
        "fuel_types": FUEL_TYPES,
        "service_types": SERVICE_TYPES,
        "service_statuses": SERVICE_STATUSES,
        "service_priorities": SERVICE_PRIORITIES,
        "comment_types": COMMENT_TYPES
    }), 200


###---------------AUTH----------------------

@api.route("/register", methods=["POST"])
def register():

    data = request.get_json() or {}

    company_name = data.get("company_name")
    cif = data.get("cif")

    workshop_phone = data.get("workshop_phone") or data.get("phone")
    workshop_email = data.get("workshop_email") or data.get("email")

    address = data.get("address")
    city = data.get("city")
    postal_code = data.get("postal_code")

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    dni = data.get("dni")
    employee_phone = data.get("employee_phone") or data.get("admin_phone") or data.get("phone")

    user_email = data.get("user_email") or data.get("email")
    password = data.get("password")
    password_confirm = data.get("password_confirm")

    if not company_name or not cif or not workshop_phone or not workshop_email:
        return error_response("company_name, cif, workshop_phone and workshop_email are required", 400)

    if not first_name or not last_name or not dni or not employee_phone:
        return error_response("first_name, last_name, dni and employee_phone are required for the admin employee", 400)

    if not user_email or not password:
        return error_response("user_email and password are required", 400)

    if password != password_confirm:
        return error_response("Passwords do not match", 400)

    existing_workshop = Workshop.query.filter(
        (Workshop.email == workshop_email) | (Workshop.cif == cif)
    ).first()

    if existing_workshop:
        return error_response("A workshop with this email or CIF already exists", 409)

    existing_employee = Employee.query.filter_by(dni=dni).first()

    if existing_employee:
        return error_response("An employee with this DNI already exists", 409)

    existing_user = User.query.filter_by(email=user_email).first()

    if existing_user:
        return error_response("A user with this email already exists", 409)

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

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

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
        "employee": employee.serialize()
    }), 200


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
        "postal_code",
        "is_active"
    ]

    for field in editable_fields:
        if field in data:
            setattr(workshop, field, data[field])

    db.session.commit()

    return jsonify({
        "message": "Workshop updated successfully",
        "workshop": workshop.serialize()
    }), 200

###---------------MECHANICS / EMPLOYEES----------------------

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
        job_position="mechanic",
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


@api.route("/mechanics/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_mechanic_detail(employee_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can see mechanic details", 403)

    employee, error = get_employee_or_error(employee_id, current_user)

    if error:
        return error

    return jsonify({
        "mechanic": employee.serialize()
    }), 200


@api.route("/mechanics/<int:employee_id>", methods=["PUT"])
@jwt_required()
def update_mechanic(employee_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can update mechanics", 403)

    employee, error = get_employee_or_error(employee_id, current_user)

    if error:
        return error

    data = request.get_json() or {}

    editable_fields = [
        "first_name",
        "last_name",
        "dni",
        "phone",
        "address",
        "city",
        "postal_code",
        "job_position",
        "specialty",
        "is_active"
    ]

    for field in editable_fields:
        if field in data:
            setattr(employee, field, data[field])

    db.session.commit()

    return jsonify({
        "message": "Mechanic updated successfully",
        "mechanic": employee.serialize()
    }), 200


@api.route("/mechanics/<int:employee_id>", methods=["DELETE"])
@jwt_required()
def delete_mechanic(employee_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can delete mechanics", 403)

    employee, error = get_employee_or_error(employee_id, current_user)

    if error:
        return error

    employee.is_active = False
    db.session.commit()

    return jsonify({
        "message": "Mechanic deactivated successfully"
    }), 200


###---------------CUSTOMERS----------------------

@api.route("/customers", methods=["GET"])
@jwt_required()
def get_customers():

    current_user = get_current_user()
    workshop_id = get_current_workshop_id(current_user)

    customers = Customer.query.filter_by(
        workshop_id=workshop_id,
        is_active=True
    ).all()

    return jsonify({
        "customers": [customer.serialize() for customer in customers]
    }), 200


@api.route("/customers", methods=["POST"])
@jwt_required()
def create_customer():

    current_user = get_current_user()
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
        "customer": customer.serialize()
    }), 201


@api.route("/customers/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer_detail(customer_id):

    current_user = get_current_user()
    customer, error = get_customer_or_error(customer_id, current_user)

    if error:
        return error

    return jsonify({
        "customer": customer.serialize()
    }), 200


@api.route("/customers/<int:customer_id>", methods=["PUT"])
@jwt_required()
def update_customer(customer_id):

    current_user = get_current_user()
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
        "address",
        "is_active"
    ]

    for field in editable_fields:
        if field in data:
            setattr(customer, field, data[field])

    db.session.commit()

    return jsonify({
        "message": "Customer updated successfully",
        "customer": customer.serialize()
    }), 200


@api.route("/customers/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):

    current_user = get_current_user()
    customer, error = get_customer_or_error(customer_id, current_user)

    if error:
        return error

    customer.is_active = False
    db.session.commit()

    return jsonify({
        "message": "Customer deactivated successfully"
    }), 200


###---------------VEHICLES----------------------

@api.route("/vehicles", methods=["GET"])
@jwt_required()
def get_vehicles():

    current_user = get_current_user()
    workshop_id = get_current_workshop_id(current_user)

    vehicles = Vehicle.query.filter_by(
        workshop_id=workshop_id,
        is_active=True
    ).all()

    return jsonify({
        "vehicles": [vehicle.serialize() for vehicle in vehicles]
    }), 200


@api.route("/vehicles", methods=["POST"])
@jwt_required()
def create_vehicle():

    current_user = get_current_user()
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

    workshop_id = get_current_workshop_id(current_user)

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


@api.route("/vehicles/<int:vehicle_id>", methods=["GET"])
@jwt_required()
def get_vehicle_detail(vehicle_id):

    current_user = get_current_user()
    vehicle, error = get_vehicle_or_error(vehicle_id, current_user)

    if error:
        return error

    return jsonify({
        "vehicle": vehicle.serialize()
    }), 200


@api.route("/vehicles/<int:vehicle_id>", methods=["PUT"])
@jwt_required()
def update_vehicle(vehicle_id):

    current_user = get_current_user()
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
        "mileage",
        "is_active"
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


@api.route("/vehicles/<int:vehicle_id>", methods=["DELETE"])
@jwt_required()
def delete_vehicle(vehicle_id):

    current_user = get_current_user()
    vehicle, error = get_vehicle_or_error(vehicle_id, current_user)

    if error:
        return error

    vehicle.is_active = False
    db.session.commit()

    return jsonify({
        "message": "Vehicle deactivated successfully"
    }), 200


###---------------SERVICES----------------------

@api.route("/services", methods=["GET"])
@jwt_required()
def get_services():

    current_user = get_current_user()
    workshop_id = get_current_workshop_id(current_user)

    status = request.args.get("status")
    vehicle_id = request.args.get("vehicle_id", type=int)
    employee_id = request.args.get("employee_id", type=int)

    query = Service.query.filter_by(workshop_id=workshop_id)

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)
        query = query.filter_by(employee_id=employee.id)

    if status:
        query = query.filter_by(status=status)

    if vehicle_id:
        query = query.filter_by(vehicle_id=vehicle_id)

    if employee_id and is_admin(current_user):
        query = query.filter_by(employee_id=employee_id)

    services = query.order_by(Service.created_at.desc()).all()

    return jsonify({
        "services": [service.serialize() for service in services]
    }), 200


@api.route("/services", methods=["POST"])
@jwt_required()
def create_service():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can create services", 403)

    data = request.get_json() or {}

    vehicle_id = data.get("vehicle_id")
    employee_id = data.get("employee_id")

    title = data.get("title")
    description = data.get("description")
    service_type = data.get("service_type")
    status = data.get("status", "pending")
    priority = data.get("priority", "normal")

    entry_mileage = data.get("entry_mileage")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    observations = data.get("observations")

    if not vehicle_id or not title or not service_type:
        return error_response("vehicle_id, title and service_type are required", 400)

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

    vehicle, error = get_vehicle_or_error(vehicle_id, current_user)

    if error:
        return error

    if employee_id:
        employee, error = get_employee_or_error(employee_id, current_user)

        if error:
            return error

    workshop_id = get_current_workshop_id(current_user)

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
        customer_id=vehicle.customer_id,
        vehicle_id=vehicle.id,
        employee_id=employee_id
    )

    db.session.add(service)
    db.session.flush()

    status_log = ServiceStatusLog(
        service_id=service.id,
        from_status=None,
        to_status=status,
        employee_id=get_current_employee(current_user).id,
        note="Service created"
    )

    db.session.add(status_log)
    db.session.commit()

    return jsonify({
        "message": "Service created successfully",
        "service": service.serialize(),
        "status_log": status_log.serialize()
    }), 201


@api.route("/services/<int:service_id>", methods=["GET"])
@jwt_required()
def get_service_detail(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if service.employee_id != employee.id:
            return error_response("You do not have permission to access this service", 403)

    return jsonify({
        "service": service.serialize()
    }), 200


@api.route("/services/<int:service_id>", methods=["PUT"])
@jwt_required()
def update_service(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    data = request.get_json() or {}

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if service.employee_id != employee.id:
            return error_response("You do not have permission to update this service", 403)

        allowed_mechanic_fields = [
            "status",
            "observations"
        ]

        for field in data:
            if field not in allowed_mechanic_fields:
                return error_response("Mechanics can only update status and observations", 403)

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

    if "employee_id" in data and data.get("employee_id"):
        employee, error = get_employee_or_error(data.get("employee_id"), current_user)

        if error:
            return error

    old_status = service.status

    editable_fields = [
        "title",
        "description",
        "service_type",
        "status",
        "priority",
        "entry_mileage",
        "observations",
        "employee_id"
    ]

    for field in editable_fields:
        if field in data:
            setattr(service, field, data[field])

    if "start_date" in data:
        service.start_date = parse_datetime(data.get("start_date"))

    if "end_date" in data:
        service.end_date = parse_datetime(data.get("end_date"))

    if "status" in data and data.get("status") != old_status:
        status_log = ServiceStatusLog(
            service_id=service.id,
            from_status=old_status,
            to_status=data.get("status"),
            employee_id=get_current_employee(current_user).id,
            note=data.get("status_note")
        )

        db.session.add(status_log)

    db.session.commit()

    return jsonify({
        "message": "Service updated successfully",
        "service": service.serialize()
    }), 200


@api.route("/services/<int:service_id>", methods=["DELETE"])
@jwt_required()
def delete_service(service_id):

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can cancel services", 403)

    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if service.status != "cancelled":
        create_status_log(
            service=service,
            employee_id=get_current_employee(current_user).id,
            new_status="cancelled",
            note="Service cancelled"
        )

    db.session.commit()

    return jsonify({
        "message": "Service cancelled successfully",
        "service": service.serialize()
    }), 200


@api.route("/services/<int:service_id>/status", methods=["PATCH"])
@jwt_required()
def update_service_status(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if service.employee_id != employee.id:
            return error_response("You do not have permission to update this service", 403)

    data = request.get_json() or {}

    new_status = data.get("status")
    note = data.get("note") or data.get("comment")

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

    status_log = create_status_log(
        service=service,
        employee_id=get_current_employee(current_user).id,
        new_status=new_status,
        note=note
    )

    if note:
        comment = ServiceComment(
            service_id=service.id,
            employee_id=get_current_employee(current_user).id,
            comment=note,
            comment_type="status_update"
        )

        db.session.add(comment)

    db.session.commit()

    return jsonify({
        "message": "Service status updated successfully",
        "service": service.serialize(),
        "status_log": status_log.serialize()
    }), 200


@api.route("/services/<int:service_id>/status-logs", methods=["GET"])
@jwt_required()
def get_service_status_logs(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if service.employee_id != employee.id:
            return error_response("You do not have permission to access this service", 403)

    status_logs = (
        ServiceStatusLog.query
        .filter_by(service_id=service.id)
        .order_by(ServiceStatusLog.changed_at.desc())
        .all()
    )

    return jsonify({
        "status_logs": [status_log.serialize() for status_log in status_logs]
    }), 200


###---------------SERVICE COMMENTS----------------------

@api.route("/services/<int:service_id>/comments", methods=["GET"])
@jwt_required()
def get_service_comments(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if service.employee_id != employee.id:
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


@api.route("/services/<int:service_id>/comments", methods=["POST"])
@jwt_required()
def create_service_comment(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if service.employee_id != employee.id:
            return error_response("You do not have permission to comment on this service", 403)

    data = request.get_json() or {}

    comment_text = data.get("comment")
    comment_type = data.get("comment_type", "note")

    if not comment_text:
        return error_response("comment is required", 400)

    if comment_type not in COMMENT_TYPES:
        return jsonify({
            "message": "Invalid comment_type",
            "error": "Invalid comment_type",
            "allowed_values": COMMENT_TYPES
        }), 400

    comment = ServiceComment(
        service_id=service.id,
        employee_id=get_current_employee(current_user).id,
        comment=comment_text,
        comment_type=comment_type
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        "message": "Comment created successfully",
        "comment": comment.serialize()
    }), 201


@api.route("/services/<int:service_id>/notify-admin", methods=["POST"])
@jwt_required()
def notify_admin(service_id):

    current_user = get_current_user()
    service, error = get_service_or_error(service_id, current_user)

    if error:
        return error

    if is_mechanic(current_user):
        employee = get_current_employee(current_user)

        if service.employee_id != employee.id:
            return error_response("You do not have permission to notify admin about this service", 403)

    data = request.get_json() or {}
    message = data.get("message")

    if not message:
        return error_response("message is required", 400)

    comment = ServiceComment(
        service_id=service.id,
        employee_id=get_current_employee(current_user).id,
        comment=message,
        comment_type="admin_alert"
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        "message": "Admin notified successfully",
        "comment": comment.serialize()
    }), 201


###---------------MECHANIC DASHBOARD----------------------

@api.route("/mechanic/services", methods=["GET"])
@jwt_required()
def get_my_mechanic_services():

    current_user = get_current_user()

    if not is_mechanic(current_user):
        return error_response("Only mechanic users can access this endpoint", 403)

    employee = get_current_employee(current_user)
    workshop_id = get_current_workshop_id(current_user)

    services = (
        Service.query
        .filter_by(
            workshop_id=workshop_id,
            employee_id=employee.id
        )
        .order_by(Service.created_at.desc())
        .all()
    )

    assigned_count = len(services)
    in_repair_count = len([service for service in services if service.status == "in_repair"])
    finished_count = len([
        service for service in services
        if service.status in ["ready_to_deliver", "delivered"]
    ])

    return jsonify({
        "services": [service.serialize() for service in services],
        "stats": {
            "assigned": assigned_count,
            "in_repair": in_repair_count,
            "finished": finished_count
        }
    }), 200


###---------------ADMIN DASHBOARD----------------------

@api.route("/admin/dashboard", methods=["GET"])
@jwt_required()
def get_admin_dashboard():

    current_user = get_current_user()

    if not is_admin(current_user):
        return error_response("Only admin users can access this endpoint", 403)

    workshop_id = get_current_workshop_id(current_user)

    active_vehicles = Vehicle.query.filter_by(
        workshop_id=workshop_id,
        is_active=True
    ).count()

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
