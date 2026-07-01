import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWorkshop } from "../services/api";

const initialState = {
  company_name: "", cif: "", phone: "", email: "",
  address: "", city: "", postal_code: "", province: "",
  country: "Spain", website: "",
  manager_first_name: "", manager_last_name: "", manager_dni: "",
  manager_phone: "", manager_email: "", manager_password: "",
  manager_password_confirm: ""
};

const patterns = {
  cif: /^[A-HJ-NP-SUVW]\d{7}[0-9A-J]$/i,
  dni: /^\d{8}[A-HJ-NP-TV-Z]$/i,
  postal_code: /^\d{5}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?\d{9,15}$/,
};

export const Register = () => {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.company_name.trim()) e.company_name = "Workshop name is required";
    if (!patterns.cif.test(form.cif)) e.cif = "Invalid CIF. Example: B12345678";
    if (!patterns.phone.test(form.phone)) e.phone = "Invalid phone number";
    if (!patterns.email.test(form.email)) e.email = "Invalid email";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!patterns.postal_code.test(form.postal_code)) e.postal_code = "Postal code must have 5 digits";
    if (!form.province.trim()) e.province = "Province is required";
    if (!form.manager_first_name.trim()) e.manager_first_name = "First name is required";
    if (!form.manager_last_name.trim()) e.manager_last_name = "Last name is required";
    if (!patterns.dni.test(form.manager_dni)) e.manager_dni = "Invalid DNI. Example: 12345678A";
    if (!patterns.phone.test(form.manager_phone)) e.manager_phone = "Invalid phone number";
    if (!patterns.email.test(form.manager_email)) e.manager_email = "Invalid email";
    if (form.manager_password.length < 8) e.manager_password = "Minimum 8 characters";
    if (form.manager_password !== form.manager_password_confirm)
      e.manager_password_confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildFullAddress = () => {
    const parts = [
      form.address.trim(),
      `${form.postal_code.trim()} ${form.city.trim()}`.trim(),
      form.province.trim(),
      form.country.trim()
    ];

    return parts.filter(Boolean).join(", ");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerMsg("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      const payload = {
        company_name: form.company_name.trim(),
        cif: form.cif.trim().toUpperCase(),

        workshop_phone: form.phone.trim(),
        workshop_email: form.email.trim(),

        address: buildFullAddress(),
        city: form.city.trim(),
        postal_code: form.postal_code.trim(),

        first_name: form.manager_first_name.trim(),
        last_name: form.manager_last_name.trim(),
        dni: form.manager_dni.trim().toUpperCase(),
        employee_phone: form.manager_phone.trim(),

        user_email: form.manager_email.trim(),
        password: form.manager_password,
        password_confirm: form.manager_password_confirm
    };  

    const res = await registerWorkshop(payload);

    if (!res.ok) {
      setServerMsg(
        res.data?.error ||
        res.data?.message ||
        "Error creating workshop"
      );
      return;
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    localStorage.setItem("employee", JSON.stringify(res.data.employee));
    localStorage.setItem("workshop", JSON.stringify(res.data.workshop));

    setRegistrationSuccess({
      workshop: res.data.workshop,
      user: res.data.user,
      employee: res.data.employee,
    });
  } catch (error) {
    console.error("Register error:", error);
    setServerMsg("Network error. Please try again.");
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

  if (registrationSuccess) {
  const { workshop, employee, user } = registrationSuccess;

  return (
    <div className="container py-5" style={{ maxWidth: 900 }}>
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
        <div className="mb-4">
          <span className="badge bg-warning text-dark mb-3">
            Setup complete
          </span>

          <h2 className="mb-2">Your workshop is ready</h2>

          <p className="text-muted mb-0">
            The workshop has been created and your administrator account is ready to use.
          </p>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="border rounded-4 p-3 h-100">
              <small className="text-muted d-block mb-1">Workshop</small>
              <h5 className="mb-1">{workshop?.company_name}</h5>
              <p className="mb-0 text-muted">{workshop?.email}</p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="border rounded-4 p-3 h-100">
              <small className="text-muted d-block mb-1">Administrator</small>
              <h5 className="mb-1">
                {employee?.first_name} {employee?.last_name}
              </h5>
              <p className="mb-0 text-muted">
                Login email: {user?.email}
              </p>
            </div>
          </div>
        </div>

        <button
          className="btn btn-warning w-100 fw-bold"
          onClick={() => navigate("/dashboard")}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="container py-4" style={{ maxWidth: 720 }}>
      <h2 className="mb-4">Workshop Registration</h2>
      {serverMsg && <div className="alert alert-danger">{serverMsg}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <h5 className="mt-3">Workshop Details</h5>
        {field("company_name", "Workshop Name")}
        {field("cif", "CIF", "text", { maxLength: 9, placeholder: "B12345678" })}
        {field("phone", "Workshop Phone", "tel", { placeholder: "+34600000000" })}
        {field("email", "Public Workshop Email", "email")}
        {field("address", "Street Address")}
        <div className="row">
          <div className="col-md-4">{field("postal_code", "Postal Code", "text", { maxLength: 5, placeholder: "28001" })}</div>
          <div className="col-md-4">{field("city", "City")}</div>
          <div className="col-md-4">{field("province", "Province")}</div>
        </div>
        {field("country", "Country")}
        
        <h5 className="mt-4">Administrator Details</h5>
        <div className="row">
          <div className="col-md-6">{field("manager_first_name", "First Name")}</div>
          <div className="col-md-6">{field("manager_last_name", "Last Name")}</div>
        </div>
        {field("manager_dni", "DNI", "text", { maxLength: 9, placeholder: "12345678A" })}
        {field("manager_phone", "Administrator Phone", "tel")}
        {field("manager_email", "Login Email", "email")}
        {field("manager_password", "Password", "password")}
        {field("manager_password_confirm", "Confirm Password", "password")}

        <button type="submit" className="btn btn-warning text-dark fw-bold w-100 py-3 rounded-4" disabled={submitting}>
          {submitting ? "Creating..." : "Create Workshop"}
        </button>
      </form>
    </div>
  );
};