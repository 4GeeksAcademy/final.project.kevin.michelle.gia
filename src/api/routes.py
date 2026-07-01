"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import re
from flask import request, jsonify, Blueprint
from api.models import db, Workshop, User, Employee
from api.utils import APIException
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)
CORS(api)
bcrypt = Bcrypt()

# ---------- regex validaciones (España) ----------
CIF_REGEX = re.compile(r"^[A-HJ-NP-SUVW]\d{7}[0-9A-J]$", re.IGNORECASE)
DNI_REGEX = re.compile(r"^\d{8}[A-HJ-NP-TV-Z]$", re.IGNORECASE)
POSTAL_CODE_REGEX = re.compile(r"^\d{5}$")
PHONE_REGEX = re.compile(r"^(\+34)?[6789]\d{8}$")
EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def get_current_user():
    current_user_id = get_jwt_identity()
    return db.session.get(User, int(current_user_id))


def user_belongs_to_workshop(user, workshop_id):
    return user is not None and user.workshop_id == workshop_id


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    return jsonify({"message": "Hello from the backend"}), 200


# ----------------------- WORKSHOP ENDPOINTS -------------

@api.route("/workshops", methods=["GET"])
@jwt_required()
def get_workshops():
    workshops = Workshop.query.all()
    return jsonify({"workshops": [w.serialize() for w in workshops]}), 200


@api.route("/workshops/<int:workshop_id>", methods=["GET"])
@jwt_required()
def get_workshop_details(workshop_id):
    current_user = get_current_user()
    if not user_belongs_to_workshop(current_user, workshop_id):
        return jsonify({"message": "You do not have permission to access this workshop"}), 403

    workshop = db.session.get(Workshop, workshop_id)
    if not workshop:
        return jsonify({"message": "Workshop not found"}), 404

    return jsonify({"workshop": workshop.serialize()}), 200


@api.route("/workshops", methods=["POST"])
def create_workshop():
    data = request.get_json() or {}

    # Datos del taller
    company_name = (data.get("company_name") or "").strip()
    cif = (data.get("cif") or "").strip().upper()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip().lower()
    address = (data.get("address") or "").strip()
    city = (data.get("city") or "").strip()
    postal_code = (data.get("postal_code") or "").strip()
    province = (data.get("province") or "").strip()
    country = (data.get("country") or "España").strip()
    website = (data.get("website") or "").strip() or None

    # Datos del gerente
    manager_first_name = (data.get("manager_first_name") or "").strip()
    manager_last_name = (data.get("manager_last_name") or "").strip()
    manager_dni = (data.get("manager_dni") or "").strip().upper()
    manager_phone = (data.get("manager_phone") or "").strip()
    manager_email = (data.get("manager_email") or "").strip().lower()
    manager_password = data.get("manager_password") or ""

    # Obligatoriedad
    required_workshop = {
        "company_name": company_name, "cif": cif, "phone": phone, "email": email,
        "address": address, "city": city, "postal_code": postal_code, "province": province
    }
    missing_workshop = [k for k, v in required_workshop.items() if not v]
    if missing_workshop:
        return jsonify({"message": f"Missing workshop fields: {', '.join(missing_workshop)}"}), 400

    required_manager = {
        "manager_first_name": manager_first_name, "manager_last_name": manager_last_name,
        "manager_dni": manager_dni, "manager_phone": manager_phone,
        "manager_email": manager_email, "manager_password": manager_password
    }
    missing_manager = [k for k, v in required_manager.items() if not v]
    if missing_manager:
        return jsonify({"message": f"Missing manager fields: {', '.join(missing_manager)}"}), 400

    # Formato
    if not CIF_REGEX.match(cif):
        return jsonify({"message": "Invalid CIF format"}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"message": "Invalid workshop email format"}), 400
    if not EMAIL_REGEX.match(manager_email):
        return jsonify({"message": "Invalid manager email format"}), 400
    if not PHONE_REGEX.match(phone):
        return jsonify({"message": "Invalid workshop phone format"}), 400
    if not PHONE_REGEX.match(manager_phone):
        return jsonify({"message": "Invalid manager phone format"}), 400
    if not POSTAL_CODE_REGEX.match(postal_code):
        return jsonify({"message": "Invalid postal code (must be 5 digits)"}), 400
    if not DNI_REGEX.match(manager_dni):
        return jsonify({"message": "Invalid DNI format"}), 400
    if len(manager_password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    # Duplicados
    if Workshop.query.filter((Workshop.email == email) | (Workshop.cif == cif)).first():
        return jsonify({"message": "A workshop with this email or CIF already exists"}), 409
    if User.query.filter_by(email=manager_email).first():
        return jsonify({"message": "A user with this email already exists"}), 409
    if Employee.query.filter_by(dni=manager_dni).first():
        return jsonify({"message": "An employee with this DNI already exists"}), 409

    # Creación
    new_workshop = Workshop(
        company_name=company_name, cif=cif, phone=phone, email=email,
        address=address, city=city, postal_code=postal_code,
        province=province, country=country, website=website
    )
    db.session.add(new_workshop)
    db.session.flush()

    password_hash = bcrypt.generate_password_hash(manager_password).decode("utf-8")
    manager_user = User(
        email=manager_email, password_hash=password_hash,
        role="gerente", workshop_id=new_workshop.id
    )
    db.session.add(manager_user)
    db.session.flush()

    manager_employee = Employee(
        first_name=manager_first_name, last_name=manager_last_name,
        dni=manager_dni, phone=manager_phone,
        workshop_id=new_workshop.id, user_id=manager_user.id
    )
    db.session.add(manager_employee)
    db.session.commit()

    return jsonify({
        "message": "Workshop, manager user and manager employee created successfully",
        "workshop": new_workshop.serialize(),
        "user": manager_user.serialize(),
        "employee": manager_employee.serialize()
    }), 201


# ---------------------- LOGIN ----------------------
@api.route("/login", methods=["POST"])
@api.route("/users/login", methods=["POST"])
def login_user():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"message": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return error_response("Invalid email or password", 401)

    employee = user.employee
    workshop = Workshop.query.filter_by(id=employee.workshop_id).first()

    if not employee:
        return error_response("This user account has no employee profile", 403)

    if not employee.is_active:
        return error_response("This employee account is inactive", 403)

    is_valid_password = bcrypt.check_password_hash(user.password_hash, password)

    if not is_valid_password:
        return error_response("Invalid email or password", 401)

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "workshop_id": user.workshop_id}
    )
    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "user": user.serialize(),
        "employee": employee.serialize(),
        "workshop": workshop.serialize()
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


# ---------------------- EMPLOYEES ----------------------
@api.route("/workshops/<int:workshop_id>/employees", methods=["GET"])
@jwt_required()
def get_workshop_employees(workshop_id):
    current_user = get_current_user()
    if not user_belongs_to_workshop(current_user, workshop_id):
        return jsonify({"message": "You do not have permission to access these employees"}), 403

    workshop = db.session.get(Workshop, workshop_id)
    if not workshop:
        return jsonify({"message": "Workshop not found"}), 404

    employees = Employee.query.filter_by(workshop_id=workshop_id).all()
    return jsonify({
        "workshop": workshop.serialize(),
        "employees": [e.serialize() for e in employees]
    }), 200


@api.route("/workshops/<int:workshop_id>/employees", methods=["POST"])
@jwt_required()
def create_employee(workshop_id):
    current_user = get_current_user()
    if not user_belongs_to_workshop(current_user, workshop_id):
        return jsonify({"message": "You do not have permission to create employees in this workshop"}), 403
    if current_user.role not in ["gerente", "administrador"]:
        return jsonify({"message": "Only gerente or administrador can create employees"}), 403

    workshop = db.session.get(Workshop, workshop_id)
    if not workshop:
        return jsonify({"message": "Workshop not found"}), 404

    data = request.get_json() or {}
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    dni = (data.get("dni") or "").strip().upper()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role")

    if role not in ["coordinador", "mecanico"]:
        return jsonify({"message": "Role must be coordinador or mecanico"}), 400
    if not all([first_name, last_name, dni, phone, email, password]):
        return jsonify({"message": "first_name, last_name, dni, phone, email and password are required"}), 400
    if not DNI_REGEX.match(dni):
        return jsonify({"message": "Invalid DNI format"}), 400
    if not PHONE_REGEX.match(phone):
        return jsonify({"message": "Invalid phone format"}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"message": "Invalid email format"}), 400
    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "A user with this email already exists"}), 409
    if Employee.query.filter_by(dni=dni).first():
        return jsonify({"message": "An employee with this DNI already exists"}), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = User(email=email, password_hash=password_hash, role=role, workshop_id=workshop_id)
    db.session.add(new_user)
    db.session.flush()

    new_employee = Employee(
        first_name=first_name, last_name=last_name, dni=dni, phone=phone,
        workshop_id=workshop_id, user_id=new_user.id
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
        return jsonify({"message": "You do not have permission to access this employee"}), 403

    workshop = db.session.get(Workshop, workshop_id)
    if not workshop:
        return jsonify({"message": "Workshop not found"}), 404

    employee = Employee.query.filter_by(id=employee_id, workshop_id=workshop_id).first()
    if not employee:
        return jsonify({"message": "Employee not found in this workshop"}), 404

    return jsonify({"employee": employee.serialize()}), 200