import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001";

const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

const PLATE_REGEX = /^[0-9]{4}[\s-]?[A-Z]{3}$/;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const emptyVehicleForm = {
  customer_id: "",
  plate: "",
  vin: "",
  brand: "",
  model: "",
  version: "",
  year: new Date().getFullYear(),
  fuel_type: "gasoline",
  power_hp: "",
  engine_cc: "",
  color: "",
  mileage: 0,
  first_registration_date: ""
};

const fuelTypes = [
  { value: "gasoline", label: "Gasoline" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "plug_in_hybrid", label: "Plug-in hybrid" },
  { value: "electric", label: "Electric" },
  { value: "lpg", label: "LPG" }
];

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getCustomerLabel(customer) {
  const fullName = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
  const dni = customer.dni ? ` · ${customer.dni}` : "";
  const email = customer.email ? ` · ${customer.email}` : "";

  return `${fullName || "Customer"}${dni}${email}`;
}

export const VehicleForm = () => {
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(emptyVehicleForm);
  const [customers, setCustomers] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    setMessage(null);

    try {
      const response = await fetch(buildUrl("/customers"), {
        method: "GET",
        headers: getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not load customers."
        );
      }

      setCustomers(data.customers || []);
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.message
      });
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleChange = (field, value) => {
    setVehicle((currentVehicle) => ({
      ...currentVehicle,
      [field]: value
    }));

    if (errors[field]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined
      }));
    }

    setMessage(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!vehicle.customer_id) {
      newErrors.customer_id = "Please select a customer.";
    }

    if (!vehicle.plate.trim()) {
      newErrors.plate = "Plate is required.";
    } else if (!PLATE_REGEX.test(vehicle.plate.trim().toUpperCase())) {
      newErrors.plate = "Invalid format. Example: 1234ABC.";
    }

    if (!vehicle.vin.trim()) {
      newErrors.vin = "VIN is required.";
    } else if (!VIN_REGEX.test(vehicle.vin.trim().toUpperCase())) {
      newErrors.vin = "Invalid VIN. It must have 17 characters and no I/O/Q.";
    }

    if (!vehicle.brand.trim()) {
      newErrors.brand = "Brand is required.";
    }

    if (!vehicle.model.trim()) {
      newErrors.model = "Model is required.";
    }

    const year = Number(vehicle.year);
    const currentYear = new Date().getFullYear();

    if (!year || year < 1900 || year > currentYear + 1) {
      newErrors.year = `Year must be between 1900 and ${currentYear + 1}.`;
    }

    const mileage = Number(vehicle.mileage);

    if (Number.isNaN(mileage) || mileage < 0) {
      newErrors.mileage = "Mileage must be a positive number.";
    }

    return newErrors;
  };

  const resetForm = () => {
    setVehicle(emptyVehicleForm);
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage(null);

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setMessage({
        type: "danger",
        text: "Please review the fields marked in red."
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        customer_id: Number(vehicle.customer_id),
        plate: vehicle.plate.trim().toUpperCase().replace(/[\s-]/g, ""),
        vin: vehicle.vin.trim().toUpperCase(),
        brand: vehicle.brand.trim(),
        model: vehicle.model.trim(),
        version: vehicle.version.trim() || null,
        year: Number(vehicle.year),
        fuel_type: vehicle.fuel_type,
        power_hp: vehicle.power_hp ? Number(vehicle.power_hp) : null,
        engine_cc: vehicle.engine_cc ? Number(vehicle.engine_cc) : null,
        color: vehicle.color.trim() || null,
        mileage: Number(vehicle.mileage) || 0,
        first_registration_date: vehicle.first_registration_date || null
      };

      const response = await fetch(buildUrl("/vehicles"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Could not create vehicle."
        );
      }

      setMessage({
        type: "success",
        text: `Vehicle ${data.vehicle?.plate || payload.plate} created successfully.`
      });

      resetForm();
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <main className="container">
        <header className="bg-white border rounded-4 shadow-sm p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
            <div>
              <p className="text-uppercase text-danger small fw-bold mb-2">
                Vehicles
              </p>

              <h1 className="fw-bold text-dark mb-2">
                Create vehicle
              </h1>

              <p className="text-muted mb-0">
                Register a vehicle and link it to an existing customer.
              </p>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={loadCustomers}
                disabled={isLoadingCustomers}
              >
                {isLoadingCustomers ? "Loading..." : "Refresh customers"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={() => navigate("/dashboard")}
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </header>

        {message && (
          <div className={`alert alert-${message.type} alert-dismissible fade show rounded-4`}>
            {message.text}

            <button
              type="button"
              className="btn-close"
              onClick={() => setMessage(null)}
            />
          </div>
        )}

        {customers.length === 0 && (
          <div className="alert alert-warning rounded-4">
            No customers found. Create a customer before registering a vehicle.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <section className="bg-white border rounded-4 shadow-sm p-4 mb-4">
            <p className="text-uppercase text-muted small fw-semibold mb-2">
              Owner
            </p>

            <h2 className="h4 fw-bold mb-4">
              Customer
            </h2>

            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold" htmlFor="customer_id">
                  Customer *
                </label>

                <select
                  id="customer_id"
                  className={`form-select py-2 px-3 ${errors.customer_id ? "is-invalid" : ""}`}
                  value={vehicle.customer_id}
                  onChange={(event) => handleChange("customer_id", event.target.value)}
                  disabled={customers.length === 0}
                  required
                >
                  <option value="">Select a customer</option>

                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {getCustomerLabel(customer)}
                    </option>
                  ))}
                </select>

                {errors.customer_id && (
                  <div className="invalid-feedback">
                    {errors.customer_id}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-4 shadow-sm p-4 mb-4">
            <p className="text-uppercase text-muted small fw-semibold mb-2">
              Vehicle data
            </p>

            <h2 className="h4 fw-bold mb-4">
              Vehicle information
            </h2>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="plate">
                  Plate *
                </label>

                <input
                  id="plate"
                  type="text"
                  className={`form-control py-2 px-3 ${errors.plate ? "is-invalid" : ""}`}
                  placeholder="1234ABC"
                  value={vehicle.plate}
                  onChange={(event) =>
                    handleChange("plate", event.target.value.toUpperCase())
                  }
                />

                {errors.plate && (
                  <div className="invalid-feedback">
                    {errors.plate}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-8">
                <label className="form-label fw-semibold" htmlFor="vin">
                  VIN *
                </label>

                <input
                  id="vin"
                  type="text"
                  className={`form-control py-2 px-3 ${errors.vin ? "is-invalid" : ""}`}
                  placeholder="17 characters"
                  maxLength={17}
                  value={vehicle.vin}
                  onChange={(event) =>
                    handleChange("vin", event.target.value.toUpperCase())
                  }
                />

                {errors.vin && (
                  <div className="invalid-feedback">
                    {errors.vin}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="brand">
                  Brand *
                </label>

                <input
                  id="brand"
                  type="text"
                  className={`form-control py-2 px-3 ${errors.brand ? "is-invalid" : ""}`}
                  placeholder="Example: Ford"
                  value={vehicle.brand}
                  onChange={(event) => handleChange("brand", event.target.value)}
                />

                {errors.brand && (
                  <div className="invalid-feedback">
                    {errors.brand}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="model">
                  Model *
                </label>

                <input
                  id="model"
                  type="text"
                  className={`form-control py-2 px-3 ${errors.model ? "is-invalid" : ""}`}
                  placeholder="Example: Focus"
                  value={vehicle.model}
                  onChange={(event) => handleChange("model", event.target.value)}
                />

                {errors.model && (
                  <div className="invalid-feedback">
                    {errors.model}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="version">
                  Version
                </label>

                <input
                  id="version"
                  type="text"
                  className="form-control py-2 px-3"
                  placeholder="Example: 1.6 TDI"
                  value={vehicle.version}
                  onChange={(event) => handleChange("version", event.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold" htmlFor="year">
                  Year *
                </label>

                <input
                  id="year"
                  type="number"
                  className={`form-control py-2 px-3 ${errors.year ? "is-invalid" : ""}`}
                  value={vehicle.year}
                  onChange={(event) => handleChange("year", event.target.value)}
                />

                {errors.year && (
                  <div className="invalid-feedback">
                    {errors.year}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold" htmlFor="fuel_type">
                  Fuel type *
                </label>

                <select
                  id="fuel_type"
                  className="form-select py-2 px-3"
                  value={vehicle.fuel_type}
                  onChange={(event) => handleChange("fuel_type", event.target.value)}
                >
                  {fuelTypes.map((fuelType) => (
                    <option key={fuelType.value} value={fuelType.value}>
                      {fuelType.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold" htmlFor="power_hp">
                  Power HP
                </label>

                <input
                  id="power_hp"
                  type="number"
                  min="0"
                  className="form-control py-2 px-3"
                  value={vehicle.power_hp}
                  onChange={(event) => handleChange("power_hp", event.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold" htmlFor="engine_cc">
                  Engine CC
                </label>

                <input
                  id="engine_cc"
                  type="number"
                  min="0"
                  className="form-control py-2 px-3"
                  value={vehicle.engine_cc}
                  onChange={(event) => handleChange("engine_cc", event.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="color">
                  Color
                </label>

                <input
                  id="color"
                  type="text"
                  className="form-control py-2 px-3"
                  value={vehicle.color}
                  onChange={(event) => handleChange("color", event.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="mileage">
                  Mileage *
                </label>

                <input
                  id="mileage"
                  type="number"
                  min="0"
                  className={`form-control py-2 px-3 ${errors.mileage ? "is-invalid" : ""}`}
                  value={vehicle.mileage}
                  onChange={(event) => handleChange("mileage", event.target.value)}
                />

                {errors.mileage && (
                  <div className="invalid-feedback">
                    {errors.mileage}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold" htmlFor="first_registration_date">
                  First registration date
                </label>

                <input
                  id="first_registration_date"
                  type="date"
                  className="form-control py-2 px-3"
                  value={vehicle.first_registration_date}
                  onChange={(event) =>
                    handleChange("first_registration_date", event.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <div className="d-flex flex-column flex-sm-row gap-2">
            <button
              type="submit"
              className="btn btn-dark px-4 py-3 fw-bold"
              disabled={isSaving || customers.length === 0}
            >
              {isSaving ? "Creating vehicle..." : "Create vehicle"}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary px-4 py-3"
              onClick={() => {
                resetForm();
                setMessage(null);
              }}
              disabled={isSaving}
            >
              Clear
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};