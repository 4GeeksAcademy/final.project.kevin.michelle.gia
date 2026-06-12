from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

#--------- data model Workshop ----------------------

class Workshop(db.Model):
    
    __tablename__ = "workshops"

    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(120), nullable=False)
    cif = db.Column(db.String(20), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    address = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(80), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    users = db.relationship("User", backref="workshop", lazy=True)# Un taller puede tener varias cuentas/usuarios
    employees = db.relationship("Employee", backref="workshop", lazy=True)##Un taller puede tener muchos empleadoss

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
            "created_at": self.created_at.isoformat()
        }


# ----------------------data model User---------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False) ####
    role = db.Column(db.String(20), nullable=False)
    workshop_id = db.Column(db.Integer, db.ForeignKey("workshops.id"), nullable=False)
    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc)) ##lambda para que la fecha se calcule en el momento de crear el registro y no cuando se carga elarchivo
    employee = db.relationship("Employee", backref="user", uselist=False) ##Un User tiene una ficha Employee

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "workshop_id": self.workshop_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat()
        }

# ---------------------- dm Employee ----------------------
class Employee(db.Model):

    __tablename__ = "employees"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    dni = db.Column(db.String(20), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    workshop_id = db.Column(db.Integer, db.ForeignKey("workshops.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    is_active = db.Column(db.Boolean(), default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    def serialize(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "dni": self.dni,
            "phone": self.phone,
            "workshop_id": self.workshop_id,
            "user_id": self.user_id,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),

            "email": self.user.email if self.user else None,
            "role": self.user.role if self.user else None
        }