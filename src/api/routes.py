"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import request, jsonify, Blueprint
from models import db, Workshop, User, Employee
from api.utils import APIException
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)
CORS(api)

bcrypt = Bcrypt()


def get_current_user():
    current_user_id = get_jwt_identity()
    return db.session.get(User, int(current_user_id))


def user_belongs_to_workshop(user, workshop_id):
    return user is not None and user.workshop_id == workshop_id


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


##-----------------------------WORKSHOP ENDPOINTS-------------


@api.route("/workshops", methods=["GET"])
@jwt_required()
def get_workshops():
    workshops = Workshop.query.all()

    return jsonify({
        "workshops": [workshop.serialize() for workshop in workshops]
    }), 200


@api.route("/workshops/<int:workshop_id>", methods=["GET"])
@jwt_required()
def get_workshop_details(workshop_id):
    current_user = get_current_user()

    if not user_belongs_to_workshop(current_user, workshop_id):
        return jsonify({
            "message": "You do not have permission to access this workshop"
        }), 403

    workshop = db.session.get(Workshop, workshop_id)

    if not workshop:
        return jsonify({
            "message": "Workshop not found"
        }), 404

    return jsonify({
        "workshop": workshop.serialize()
    }), 200


@api.route("/workshops", methods=["POST"])
def create_workshop():
    data = request.get_json() or {}

    company_name = data.get("company_name")
    cif = data.get("cif")
    phone = data.get("phone")
    email = data.get("email")
    address = data.get("address")
    city = data.get("city")
    postal_code = data.get("postal_code")

    manager_first_name = data.get("manager_first_name")
    manager_last_name = data.get("manager_last_name")
    manager_dni = data.get("manager_dni")
    manager_phone = data.get("manager_phone")
    manager_email = data.get("manager_email")
    manager_password = data.get("manager_password")

    if not company_name or not cif or not phone or not email:
        return jsonify({
            "message": "company_name, cif, phone and email are required"
        }), 400

    if not manager_first_name or not manager_last_name or not manager_phone or not manager_email or not manager_password:
        return jsonify({
            "message": "manager_first_name, manager_last_name, manager_phone, manager_email and manager_password are required"
        }), 400

    existing_workshop = Workshop.query.filter(
        (Workshop.email == email) | (Workshop.cif == cif)
    ).first()

    if existing_workshop:
        return jsonify({
            "message": "A workshop with this email or CIF already exists"
        }), 409

    existing_user = User.query.filter_by(email=manager_email).first()

    if existing_user:
        return jsonify({
            "message": "A user with this email already exists"
        }), 409

    if manager_dni:
        existing_employee_dni = Employee.query.filter_by(dni=manager_dni).first()

        if existing_employee_dni:
            return jsonify({
                "message": "An employee with this DNI already exists"
            }), 409

    new_workshop = Workshop(
        company_name=company_name,
        cif=cif,
        phone=phone,
        email=email,
        address=address,
        city=city,
        postal_code=postal_code
    )

    db.session.add(new_workshop)
    db.session.flush()

    password_hash = bcrypt.generate_password_hash(manager_password).decode("utf-8")

    manager_user = User(
        email=manager_email,
        password_hash=password_hash,
        role="gerente",
        workshop_id=new_workshop.id
    )

    db.session.add(manager_user)
    db.session.flush()

    manager_employee = Employee(
        first_name=manager_first_name,
        last_name=manager_last_name,
        dni=manager_dni,
        phone=manager_phone,
        workshop_id=new_workshop.id,
        user_id=manager_user.id
    )

    db.session.add(manager_employee)
    db.session.commit()

    return jsonify({
        "message": "Workshop, manager user and manager employee created successfully",
        "workshop": new_workshop.serialize(),
        "user": manager_user.serialize(),
        "employee": manager_employee.serialize()
    }), 201


# ---------------------- USER LOGIN ENDPOINT ----------------------


@api.route("/login", methods=["POST"])
@api.route("/users/login", methods=["POST"])
def login_user():
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "email and password are required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    if not user.is_active:
        return jsonify({
            "message": "This user account is inactive"
        }), 403

    is_valid_password = bcrypt.check_password_hash(user.password_hash, password)

    if not is_valid_password:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role,
            "workshop_id": user.workshop_id
        }
    )

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": user.serialize(),
        "employee": user.employee.serialize() if user.employee else None
    }), 200


# ---------------------- EMPLOYEE ENDPOINTS ----------------------


@api.route("/workshops/<int:workshop_id>/employees", methods=["GET"])
@jwt_required()
def get_workshop_employees(workshop_id):
    current_user = get_current_user()

    if not user_belongs_to_workshop(current_user, workshop_id):
        return jsonify({
            "message": "You do not have permission to access these employees"
        }), 403

    workshop = db.session.get(Workshop, workshop_id)

    if not workshop:
        return jsonify({
            "message": "Workshop not found"
        }), 404

    employees = Employee.query.filter_by(workshop_id=workshop_id).all()

    return jsonify({
        "workshop": workshop.serialize(),
        "employees": [employee.serialize() for employee in employees]
    }), 200


@api.route("/workshops/<int:workshop_id>/employees", methods=["POST"])
@jwt_required()
def create_employee(workshop_id):
    current_user = get_current_user()

    if not user_belongs_to_workshop(current_user, workshop_id):
        return jsonify({
            "message": "You do not have permission to create employees in this workshop"
        }), 403

    if current_user.role not in ["gerente", "administrador"]:
        return jsonify({
            "message": "Only gerente or administrador can create employees"
        }), 403

    data = request.get_json() or {}

    workshop = db.session.get(Workshop, workshop_id)

    if not workshop:
        return jsonify({
            "message": "Workshop not found"
        }), 404

    first_name = data.get("first_name")
    last_name = data.get("last_name")
    dni = data.get("dni")
    phone = data.get("phone")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    allowed_roles = ["coordinador", "mecanico"]

    if role not in allowed_roles:
        return jsonify({
            "message": "Role must be coordinador or mecanico"
        }), 400

    if not first_name or not last_name or not phone or not email or not password:
        return jsonify({
            "message": "first_name, last_name, phone, email and password are required"
        }), 400

    existing_user = User.query.filter_by(email=email).first()

    if existing_user:
        return jsonify({
            "message": "A user with this email already exists"
        }), 409

    if dni:
        existing_employee_dni = Employee.query.filter_by(dni=dni).first()

        if existing_employee_dni:
            return jsonify({
                "message": "An employee with this DNI already exists"
            }), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    new_user = User(
        email=email,
        password_hash=password_hash,
        role=role,
        workshop_id=workshop_id
    )

    db.session.add(new_user)
    db.session.flush()

    new_employee = Employee(
        first_name=first_name,
        last_name=last_name,
        dni=dni,
        phone=phone,
        workshop_id=workshop_id,
        user_id=new_user.id
    )

    db.session.add(new_employee)
    db.session.commit()

    return jsonify({
        "message": "Employee user and employee profile created successfully",
        "user": new_user.serialize(),
        "employee": new_employee.serialize()
    }), 201


@api.route("/workshops/<int:workshop_id>/employees/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_employee_detail(workshop_id, employee_id):
    current_user = get_current_user()

    if not user_belongs_to_workshop(current_user, workshop_id):
        return jsonify({
            "message": "You do not have permission to access this employee"
        }), 403

    workshop = db.session.get(Workshop, workshop_id)

    if not workshop:
        return jsonify({
            "message": "Workshop not found"
        }), 404

    employee = Employee.query.filter_by(
        id=employee_id,
        workshop_id=workshop_id
    ).first()

    if not employee:
        return jsonify({
            "message": "Employee not found in this workshop"
        }), 404

    return jsonify({
        "employee": employee.serialize()
    }), 200

