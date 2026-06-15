from datetime import datetime, date
from typing import List, Optional
import enum

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import (
    String, Integer, Float, DateTime, Date, ForeignKey, Boolean, Text,
    Enum as SQLEnum, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

db = SQLAlchemy()


class TipoCombustible(enum.Enum):
    GASOLINA = "gasolina"
    DIESEL = "diesel"
    HIBRIDO = "hibrido"
    HIBRIDO_ENCHUFABLE = "hibrido_enchufable"
    ELECTRICO = "electrico"
    GLP = "glp"


class EstadoReparacion(enum.Enum):
    PENDIENTE = "pendiente"
    EN_PROCESO = "en_proceso"
    FINALIZADA = "finalizada"
    CANCELADA = "cancelada"


class EstadoMantenimiento(enum.Enum):
    PROGRAMADO = "programado"
    REALIZADO = "realizado"
    OMITIDO = "omitido"
    VENCIDO = "vencido"


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean(), nullable=False, default=True)

    def serialize(self):
        return {"id": self.id, "email": self.email}


class Cliente(db.Model):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(120), nullable=False)
    dni: Mapped[str] = mapped_column(
        String(20), unique=True, nullable=False, index=True)
    telefono: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(120))
    direccion: Mapped[Optional[str]] = mapped_column(String(255))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_alta: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    propiedades: Mapped[List["Propiedad"]] = relationship(
        back_populates="cliente")

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellidos": self.apellidos,
            "dni": self.dni,
            "telefono": self.telefono,
            "email": self.email,
            "direccion": self.direccion,
            "activo": self.activo,
            "fecha_alta": self.fecha_alta.isoformat() if self.fecha_alta else None,
        }


class Vehiculo(db.Model):
    __tablename__ = "vehiculos"

    id: Mapped[int] = mapped_column(primary_key=True)

    # Identificación
    matricula: Mapped[str] = mapped_column(
        String(15), unique=True, nullable=False, index=True)
    vin: Mapped[str] = mapped_column(
        String(17), unique=True, nullable=False, index=True)
    marca: Mapped[str] = mapped_column(String(50), nullable=False)
    modelo: Mapped[str] = mapped_column(String(80), nullable=False)
    version: Mapped[Optional[str]] = mapped_column(String(80))
    año: Mapped[int] = mapped_column(Integer, nullable=False)
    combustible: Mapped[TipoCombustible] = mapped_column(
        SQLEnum(TipoCombustible), nullable=False)
    potencia_cv: Mapped[Optional[int]] = mapped_column(Integer)
    cilindrada_cc: Mapped[Optional[int]] = mapped_column(Integer)
    color: Mapped[Optional[str]] = mapped_column(String(40))
    kilometraje_actual: Mapped[int] = mapped_column(Integer, default=0)
    fecha_primera_matriculacion: Mapped[Optional[date]] = mapped_column(Date)

    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_alta: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)

    propiedades: Mapped[List["Propiedad"]] = relationship(
        back_populates="vehiculo", cascade="all, delete-orphan"
    )
    kilometrajes: Mapped[List["HistorialKilometraje"]] = relationship(
        back_populates="vehiculo",
        cascade="all, delete-orphan",
        order_by="HistorialKilometraje.fecha_registro.desc()"
    )
    reparaciones: Mapped[List["Reparacion"]] = relationship(
        back_populates="vehiculo", cascade="all, delete-orphan"
    )
    mantenimientos: Mapped[List["Mantenimiento"]] = relationship(
        back_populates="vehiculo", cascade="all, delete-orphan"
    )

    @property
    def propietario_actual(self):
        for p in self.propiedades:
            if p.es_actual:
                return p.cliente
        return None

    @property
    def coste_total_acumulado(self) -> float:
        total_rep = sum(r.coste_total or 0 for r in self.reparaciones)
        total_mant = sum(
            m.coste or 0 for m in self.mantenimientos
            if m.estado == EstadoMantenimiento.REALIZADO
        )
        return round(total_rep + total_mant, 2)

    @property
    def horas_mano_obra_totales(self) -> float:
        horas_rep = sum(
            r.tiempo_mano_obra_horas or 0 for r in self.reparaciones)
        horas_mant = sum(
            m.tiempo_mano_obra_horas or 0 for m in self.mantenimientos
            if m.estado == EstadoMantenimiento.REALIZADO
        )
        return round(horas_rep + horas_mant, 2)

    def serialize(self, incluir_historial: bool = False):
        data = {
            "id": self.id,
            "matricula": self.matricula,
            "vin": self.vin,
            "marca": self.marca,
            "modelo": self.modelo,
            "version": self.version,
            "año": self.año,
            "combustible": self.combustible.value if self.combustible else None,
            "potencia_cv": self.potencia_cv,
            "cilindrada_cc": self.cilindrada_cc,
            "color": self.color,
            "kilometraje_actual": self.kilometraje_actual,
            "fecha_primera_matriculacion": (
                self.fecha_primera_matriculacion.isoformat()
                if self.fecha_primera_matriculacion else None
            ),
            "activo": self.activo,
            "propietario_actual": (
                self.propietario_actual.serialize() if self.propietario_actual else None
            ),
            "coste_total_acumulado": self.coste_total_acumulado,
            "horas_mano_obra_totales": self.horas_mano_obra_totales,
        }
        if incluir_historial:
            data["historial_propietarios"] = [p.serialize()
                                              for p in self.propiedades]
            data["historial_kilometraje"] = [k.serialize()
                                             for k in self.kilometrajes]
            data["reparaciones"] = [r.serialize() for r in self.reparaciones]
            data["mantenimientos"] = [m.serialize()
                                      for m in self.mantenimientos]
        return data


class Propiedad(db.Model):
    __tablename__ = "propiedades"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehiculo_id: Mapped[int] = mapped_column(
        ForeignKey("vehiculos.id"), nullable=False)
    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("clientes.id"), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[Optional[date]] = mapped_column(Date)
    es_actual: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    observaciones: Mapped[Optional[str]] = mapped_column(Text)

    vehiculo: Mapped["Vehiculo"] = relationship(back_populates="propiedades")
    cliente: Mapped["Cliente"] = relationship(back_populates="propiedades")

    __table_args__ = (
        Index("ix_propietario_actual_unico", "vehiculo_id", "es_actual",
              unique=True, postgresql_where=(es_actual == True)),
    )

    def serialize(self):
        return {
            "id": self.id,
            "vehiculo_id": self.vehiculo_id,
            "cliente": self.cliente.serialize() if self.cliente else None,
            "fecha_inicio": self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            "fecha_fin": self.fecha_fin.isoformat() if self.fecha_fin else None,
            "es_actual": self.es_actual,
            "observaciones": self.observaciones,
        }


class HistorialKilometraje(db.Model):
    __tablename__ = "historial_kilometraje"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehiculo_id: Mapped[int] = mapped_column(
        ForeignKey("vehiculos.id"), nullable=False, index=True)
    kilometraje: Mapped[int] = mapped_column(Integer, nullable=False)
    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False)
    motivo: Mapped[Optional[str]] = mapped_column(String(120))
    registrado_por: Mapped[Optional[str]] = mapped_column(String(120))

    vehiculo: Mapped["Vehiculo"] = relationship(back_populates="kilometrajes")

    def serialize(self):
        return {
            "id": self.id,
            "vehiculo_id": self.vehiculo_id,
            "kilometraje": self.kilometraje,
            "fecha_registro": self.fecha_registro.isoformat() if self.fecha_registro else None,
            "motivo": self.motivo,
            "registrado_por": self.registrado_por,
        }


class Mecanico(db.Model):
    __tablename__ = "mecanicos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(120), nullable=False)
    dni: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    especialidad: Mapped[Optional[str]] = mapped_column(String(120))
    telefono: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(120))
    coste_hora: Mapped[Optional[float]] = mapped_column(Float)
    fecha_alta: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    intervenciones: Mapped[List["ReparacionMecanico"]
                           ] = relationship(back_populates="mecanico")

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "apellidos": self.apellidos,
            "dni": self.dni,
            "especialidad": self.especialidad,
            "telefono": self.telefono,
            "email": self.email,
            "coste_hora": self.coste_hora,
            "activo": self.activo,
            "fecha_alta": self.fecha_alta.isoformat() if self.fecha_alta else None,
        }


class Reparacion(db.Model):
    __tablename__ = "reparaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehiculo_id: Mapped[int] = mapped_column(
        ForeignKey("vehiculos.id"), nullable=False, index=True)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_entrada: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False)
    fecha_salida: Mapped[Optional[datetime]] = mapped_column(DateTime)
    kilometraje_entrada: Mapped[Optional[int]] = mapped_column(Integer)
    coste_repuestos: Mapped[float] = mapped_column(Float, default=0.0)
    coste_mano_obra: Mapped[float] = mapped_column(Float, default=0.0)
    coste_total: Mapped[float] = mapped_column(Float, default=0.0)
    tiempo_mano_obra_horas: Mapped[float] = mapped_column(Float, default=0.0)
    estado: Mapped[EstadoReparacion] = mapped_column(
        SQLEnum(EstadoReparacion), default=EstadoReparacion.PENDIENTE
    )
    observaciones: Mapped[Optional[str]] = mapped_column(Text)

    vehiculo: Mapped["Vehiculo"] = relationship(back_populates="reparaciones")
    mecanicos_asignados: Mapped[List["ReparacionMecanico"]] = relationship(
        back_populates="reparacion", cascade="all, delete-orphan"
    )

    def recalcular_coste_total(self):

        self.coste_total = round(
            (self.coste_repuestos or 0) + (self.coste_mano_obra or 0), 2)

    def serialize(self):
        return {
            "id": self.id,
            "vehiculo_id": self.vehiculo_id,
            "descripcion": self.descripcion,
            "fecha_entrada": self.fecha_entrada.isoformat() if self.fecha_entrada else None,
            "fecha_salida": self.fecha_salida.isoformat() if self.fecha_salida else None,
            "kilometraje_entrada": self.kilometraje_entrada,
            "coste_repuestos": self.coste_repuestos,
            "coste_mano_obra": self.coste_mano_obra,
            "coste_total": self.coste_total,
            "tiempo_mano_obra_horas": self.tiempo_mano_obra_horas,
            "estado": self.estado.value if self.estado else None,
            "observaciones": self.observaciones,
            "mecanicos": [
                {
                    "mecanico": rm.mecanico.serialize() if rm.mecanico else None,
                    "horas_invertidas": rm.horas_invertidas,
                    "rol": rm.rol,
                } for rm in self.mecanicos_asignados
            ],
        }


class ReparacionMecanico(db.Model):
    __tablename__ = "reparacion_mecanico"

    reparacion_id: Mapped[int] = mapped_column(
        ForeignKey("reparaciones.id"), primary_key=True)
    mecanico_id: Mapped[int] = mapped_column(
        ForeignKey("mecanicos.id"), primary_key=True)
    horas_invertidas: Mapped[float] = mapped_column(Float, default=0.0)
    rol: Mapped[Optional[str]] = mapped_column(String(60))

    reparacion: Mapped["Reparacion"] = relationship(
        back_populates="mecanicos_asignados")
    mecanico: Mapped["Mecanico"] = relationship(
        back_populates="intervenciones")


class TipoMantenimiento(db.Model):

    __tablename__ = "tipos_mantenimiento"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(
        String(80), unique=True, nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text)
    intervalo_km: Mapped[Optional[int]] = mapped_column(Integer)
    intervalo_meses: Mapped[Optional[int]] = mapped_column(Integer)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    def serialize(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "intervalo_km": self.intervalo_km,
            "intervalo_meses": self.intervalo_meses,
            "activo": self.activo,
        }


class Mantenimiento(db.Model):
    __tablename__ = "mantenimientos"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehiculo_id: Mapped[int] = mapped_column(
        ForeignKey("vehiculos.id"), nullable=False, index=True)
    tipo_mantenimiento_id: Mapped[int] = mapped_column(
        ForeignKey("tipos_mantenimiento.id"), nullable=False)
    mecanico_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("mecanicos.id"))

    fecha_programada: Mapped[Optional[date]] = mapped_column(Date)
    fecha_realizado: Mapped[Optional[date]] = mapped_column(Date)
    kilometraje_programado: Mapped[Optional[int]] = mapped_column(Integer)
    kilometraje_realizado: Mapped[Optional[int]] = mapped_column(Integer)
    coste: Mapped[float] = mapped_column(Float, default=0.0)
    tiempo_mano_obra_horas: Mapped[float] = mapped_column(Float, default=0.0)
    estado: Mapped[EstadoMantenimiento] = mapped_column(
        SQLEnum(EstadoMantenimiento), default=EstadoMantenimiento.PROGRAMADO
    )
    observaciones: Mapped[Optional[str]] = mapped_column(Text)

    vehiculo: Mapped["Vehiculo"] = relationship(
        back_populates="mantenimientos")
    tipo: Mapped["TipoMantenimiento"] = relationship()
    mecanico: Mapped[Optional["Mecanico"]] = relationship()

    def serialize(self):
        return {
            "id": self.id,
            "vehiculo_id": self.vehiculo_id,
            "tipo": self.tipo.serialize() if self.tipo else None,
            "mecanico": self.mecanico.serialize() if self.mecanico else None,
            "fecha_programada": self.fecha_programada.isoformat() if self.fecha_programada else None,
            "fecha_realizado": self.fecha_realizado.isoformat() if self.fecha_realizado else None,
            "kilometraje_programado": self.kilometraje_programado,
            "kilometraje_realizado": self.kilometraje_realizado,
            "coste": self.coste,
            "tiempo_mano_obra_horas": self.tiempo_mano_obra_horas,
            "estado": self.estado.value if self.estado else None,
            "observaciones": self.observaciones,
        }


class AuditoriaLog(db.Model):

    __tablename__ = "auditoria_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    tabla: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    registro_id: Mapped[int] = mapped_column(
        Integer, nullable=False, index=True)
    accion: Mapped[str] = mapped_column(String(20), nullable=False)
    valores_anteriores: Mapped[Optional[str]] = mapped_column(Text)
    valores_nuevos: Mapped[Optional[str]] = mapped_column(Text)
    usuario: Mapped[Optional[str]] = mapped_column(String(120))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )

    def serialize(self):
        return {
            "id": self.id,
            "tabla": self.tabla,
            "registro_id": self.registro_id,
            "accion": self.accion,
            "valores_anteriores": self.valores_anteriores,
            "valores_nuevos": self.valores_nuevos,
            "usuario": self.usuario,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
