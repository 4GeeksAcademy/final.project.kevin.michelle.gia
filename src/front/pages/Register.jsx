import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkshop } from "../services/api";

const initialState = {
  company_name: "", cif: "", phone: "", email: "",
  address: "", city: "", postal_code: "", province: "",
  country: "España", website: "",
  manager_first_name: "", manager_last_name: "", manager_dni: "",
  manager_phone: "", manager_email: "", manager_password: "",
  manager_password_confirm: ""
};

const patterns = {
  cif: /^[A-HJ-NP-SUVW]\d{7}[0-9A-J]$/i,
  dni: /^\d{8}[A-HJ-NP-TV-Z]$/i,
  postal_code: /^\d{5}$/,
  phone: /^(\+34)?[6789]\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

export const RegisterWorkshop = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.company_name.trim()) e.company_name = "Nombre obligatorio";
    if (!patterns.cif.test(form.cif)) e.cif = "CIF inválido (ej: B12345678)";
    if (!patterns.phone.test(form.phone)) e.phone = "Teléfono inválido";
    if (!patterns.email.test(form.email)) e.email = "Email inválido";
    if (!form.address.trim()) e.address = "Dirección obligatoria";
    if (!form.city.trim()) e.city = "Ciudad obligatoria";
    if (!patterns.postal_code.test(form.postal_code)) e.postal_code = "CP de 5 dígitos";
    if (!form.province.trim()) e.province = "Provincia obligatoria";
    if (!form.manager_first_name.trim()) e.manager_first_name = "Nombre obligatorio";
    if (!form.manager_last_name.trim()) e.manager_last_name = "Apellidos obligatorios";
    if (!patterns.dni.test(form.manager_dni)) e.manager_dni = "DNI inválido (ej: 12345678A)";
    if (!patterns.phone.test(form.manager_phone)) e.manager_phone = "Teléfono inválido";
    if (!patterns.email.test(form.manager_email)) e.manager_email = "Email inválido";
    if (form.manager_password.length < 8) e.manager_password = "Mínimo 8 caracteres";
    if (form.manager_password !== form.manager_password_confirm)
      e.manager_password_confirm = "Las contraseñas no coinciden";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerMsg("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { manager_password_confirm, ...payload } = form;
      const res = await createWorkshop(payload);
      if (!res.ok) {
        setServerMsg(res.data?.message || "Error al registrar el taller");
        return;
      }
      navigate("/login", { state: { justRegistered: true } });
    } catch {
      setServerMsg("Error de red. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, label, type = "text", extra = {}) => (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`form-control ${errors[name] ? "is-invalid" : ""}`}
        {...extra}
      />
      {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
    </div>
  );

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-4">Registro de Taller</h2>
      {serverMsg && <div className="alert alert-danger">{serverMsg}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <h5 className="mt-3">Datos del taller</h5>
        {field("company_name", "Razón social")}
        {field("cif", "CIF", "text", { maxLength: 9, placeholder: "B12345678" })}
        {field("phone", "Teléfono", "tel", { placeholder: "+34600000000" })}
        {field("email", "Email del taller", "email")}
        {field("address", "Dirección")}
        <div className="row">
          <div className="col-md-4">{field("postal_code", "Código postal", "text", { maxLength: 5, placeholder: "28001" })}</div>
          <div className="col-md-4">{field("city", "Ciudad")}</div>
          <div className="col-md-4">{field("province", "Provincia")}</div>
        </div>
        {field("country", "País")}
        {field("website", "Web (opcional)", "url", { placeholder: "https://" })}

        <h5 className="mt-4">Datos del gerente</h5>
        <div className="row">
          <div className="col-md-6">{field("manager_first_name", "Nombre")}</div>
          <div className="col-md-6">{field("manager_last_name", "Apellidos")}</div>
        </div>
        {field("manager_dni", "DNI", "text", { maxLength: 9, placeholder: "12345678A" })}
        {field("manager_phone", "Teléfono", "tel")}
        {field("manager_email", "Email", "email")}
        {field("manager_password", "Contraseña", "password")}
        {field("manager_password_confirm", "Repite la contraseña", "password")}

        <button type="submit" className="btn btn-primary w-100 mt-3" disabled={submitting}>
          {submitting ? "Creando..." : "Crear taller"}
        </button>
      </form>
    </div>
  );
};