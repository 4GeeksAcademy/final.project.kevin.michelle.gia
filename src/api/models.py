from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


# ============================================================
#   WORKSHOP
# ============================================================

class Workshop(db.Model):

    __tablename__ = "workshops"

    id = db.Column(db.Integer, primary_key=True)

    company_name = db.Column(db.String(120), nullable=False)
    cif = db.Column(db.String(50), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    address = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(80), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    employees = db.relationship("Employee", backref="workshop", lazy=True)
    customers = db.relationship("Customer", backref="workshop", lazy=True)
    vehicles = db.relationship("Vehicle", backref="workshop", lazy=True)
    services = db.relationship("Service", backref="workshop", lazy=True)

    def serialize(self):

        return {

            "id": self.id,
            "company_name": self.company_name,
            "cif": self.cif,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "city": self.city,
            "postal_code": self.postal_code,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None

        }


# ============================================================
#   USER
# ============================================================

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)

    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    employee = db.relationship("Employee", backref=db.backref("user", uselist=False), uselist=False)

    def serialize(self):

        return {

            "id": self.id,
            "email": self.email,
            "employee_id": self.employee_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "employee": self.employee.serialize_basic() if self.employee else None

        }


# ============================================================
#   EMPLOYEE
# ============================================================

class Employee(db.Model):

    __tablename__ = "employees"

    id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    dni = db.Column(db.String(20), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(80), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="mechanic")
    job_position = db.Column(db.String(80), nullable=True)
    specialty = db.Column(db.String(120), nullable=True)
    workshop_id = db.Column(db.Integer, db.ForeignKey("workshops.id"), nullable=False)
    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    services = db.relationship("Service", backref="employee", lazy=True)

    def serialize_basic(self):

        return {

            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "workshop_id": self.workshop_id,
            "is_active": self.is_active

        }

    def serialize(self):

        return {

            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "dni": self.dni,
            "phone": self.phone,
            "address": self.address,
            "city": self.city,
            "postal_code": self.postal_code,
            "role": self.role,
            "job_position": self.job_position,
            "specialty": self.specialty,
            "workshop_id": self.workshop_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "email": self.user.email if self.user else None

        }


# ============================================================
#   CUSTOMER
# ============================================================

class Customer(db.Model):

    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)

    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    dni = db.Column(db.String(20), unique=True, nullable=False)
    driving_license = db.Column(db.String(20), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.String(200), nullable=True)

    workshop_id = db.Column(db.Integer, db.ForeignKey("workshops.id"), nullable=False)

    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    vehicles = db.relationship("Vehicle", backref="customer", lazy=True)
    services = db.relationship("Service", backref="customer", lazy=True)

    def serialize(self):

        return {

            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "dni": self.dni,
            "driving_license": self.driving_license,
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "workshop_id": self.workshop_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None

        }


# ============================================================
#   VEHICLE
# ============================================================

class Vehicle(db.Model):

    __tablename__ = "vehicles"

    id = db.Column(db.Integer, primary_key=True)

    plate = db.Column(db.String(20), unique=True, nullable=False)
    vin = db.Column(db.String(50), unique=True, nullable=True)
    brand = db.Column(db.String(80), nullable=False)
    model = db.Column(db.String(80), nullable=False)
    version = db.Column(db.String(80), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    fuel_type = db.Column(db.String(30), nullable=False)
    power_hp = db.Column(db.Integer, nullable=True)
    engine_cc = db.Column(db.Integer, nullable=True)
    color = db.Column(db.String(50), nullable=True)
    mileage = db.Column(db.Integer, default=0, nullable=False)
    first_registration_date = db.Column(db.Date, nullable=True)

    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    workshop_id = db.Column(db.Integer, db.ForeignKey("workshops.id"), nullable=False)

    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    services = db.relationship("Service", backref="vehicle", lazy=True)

    def serialize(self):

        return {

            "id": self.id,
            "plate": self.plate,
            "vin": self.vin,
            "brand": self.brand,
            "model": self.model,
            "version": self.version,
            "year": self.year,
            "fuel_type": self.fuel_type,
            "power_hp": self.power_hp,
            "engine_cc": self.engine_cc,
            "color": self.color,
            "mileage": self.mileage,
            "first_registration_date": self.first_registration_date.isoformat() if self.first_registration_date else None,
            "customer_id": self.customer_id,
            "workshop_id": self.workshop_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "customer_name": f"{self.customer.first_name} {self.customer.last_name}" if self.customer else None

        }


# ============================================================
#   SERVICE
# ============================================================

class Service(db.Model):

    __tablename__ = "services"

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    service_type = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(30), default="pending", nullable=False)
    priority = db.Column(db.String(20), default="normal", nullable=False)

    entry_mileage = db.Column(db.Integer, nullable=True)
    start_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    end_date = db.Column(db.DateTime, nullable=True)
    observations = db.Column(db.Text, nullable=True)

    workshop_id = db.Column(db.Integer, db.ForeignKey("workshops.id"), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.id"), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey("vehicles.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    comments = db.relationship("ServiceComment", backref="service", lazy=True)
    status_logs = db.relationship("ServiceStatusLog", backref="service", lazy=True)

    def serialize(self):

        return {

            "id": self.id,
            "title": self.title,
            "description": self.description,
            "service_type": self.service_type,
            "status": self.status,
            "priority": self.priority,
            "entry_mileage": self.entry_mileage,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "observations": self.observations,
            "workshop_id": self.workshop_id,
            "customer_id": self.customer_id,
            "vehicle_id": self.vehicle_id,
            "employee_id": self.employee_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "vehicle_plate": self.vehicle.plate if self.vehicle else None,
            "vehicle_brand": self.vehicle.brand if self.vehicle else None,
            "vehicle_model": self.vehicle.model if self.vehicle else None,
            "customer_name": f"{self.customer.first_name} {self.customer.last_name}" if self.customer else None,
            "employee_name": f"{self.employee.first_name} {self.employee.last_name}" if self.employee else None

        }


# ============================================================
#   SERVICE COMMENT
# ============================================================

class ServiceComment(db.Model):

    __tablename__ = "service_comments"

    id = db.Column(db.Integer, primary_key=True)

    comment = db.Column(db.Text, nullable=False)
    comment_type = db.Column(db.String(50), default="note", nullable=False)

    image_url = db.Column(db.String(500), nullable=True)
    image_public_id = db.Column(db.String(255), nullable=True)

    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    author = db.relationship("Employee", foreign_keys=[employee_id])

    def serialize(self):

        return {

            "id": self.id,
            "comment": self.comment,
            "comment_type": self.comment_type,
            "service_id": self.service_id,
            "employee_id": self.employee_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "author_name": f"{self.author.first_name} {self.author.last_name}" if self.author else None,
            "author_email": self.author.user.email if self.author and self.author.user else None,
            "image_url": self.image_url,
            "image_public_id": self.image_public_id,
        }


# ============================================================
#   SERVICE STATUS
# ============================================================

class ServiceStatusLog(db.Model):

    __tablename__ = "service_status_logs"

    id = db.Column(db.Integer, primary_key=True)

    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)
    from_status = db.Column(db.String(30), nullable=True)
    to_status = db.Column(db.String(30), nullable=False)

    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=True)

    note = db.Column(db.Text, nullable=True)
    changed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    changed_by = db.relationship("Employee", foreign_keys=[employee_id])

    def serialize(self):

        return {

            "id": self.id,
            "service_id": self.service_id,
            "from_status": self.from_status,
            "to_status": self.to_status,
            "employee_id": self.employee_id,
            "changed_by": f"{self.changed_by.first_name} {self.changed_by.last_name}" if self.changed_by else None,
            "note": self.note,
            "changed_at": self.changed_at.isoformat() if self.changed_at else None

        }

# ============================================================
#   PASSWORD RESET
# ============================================================

class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False, unique=True)

    expires_at = db.Column(db.DateTime, nullable=False)
    used_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="password_reset_tokens")

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "used_at": self.used_at.isoformat() if self.used_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }