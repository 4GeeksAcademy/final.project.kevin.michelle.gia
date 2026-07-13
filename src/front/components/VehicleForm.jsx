import { useState } from "react";

const PLATE_REGEX = /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const normalizePlate = (value = "") =>
  value.replace(/[\s-]/g, "").toUpperCase();

function ButtonSpinner({ text }) {
  return (
    <>
      <span
        className="spinner-border spinner-border-sm me-2"
        role="status"
        aria-hidden="true"
      ></span>
      {text}
    </>
  );
}

export const VehicleForm = ({
  selectedCustomer,
  selectedVehicle,
  customerVehicles,
  vehicleForm,
  showVehicleForm,
  isBusy,
  isSavingVehicle,
  onSelectVehicle,
  onVehicleFormChange,
  onCreateVehicle,
  onToggleVehicleForm,
  onClearVehicleForm,
  onBack,
  onContinue,
  getCustomerLabel,
  getVehicleName,
  fuelTypes
}) => {
  const [errors, setErrors] = useState({});

  const handleFieldChange = (event) => {
    const { name, value, type } = event.target;

    if (errors[name]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: undefined
      }));
    }

    let nextValue = value;

    if (name === "plate") {
      nextValue = normalizePlate(value);
    }

    if (name === "vin") {
      nextValue = value.replace(/\s/g, "").toUpperCase();
    }

    onVehicleFormChange({
      target: {
        name,
        value: nextValue,
        type
      }
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!selectedCustomer) {
      nextErrors.general = "Please select or create a customer first.";
    }

    const plate = normalizePlate(vehicleForm.plate || "");

    if (!plate) {
      nextErrors.plate = "Required";
    } else if (!PLATE_REGEX.test(plate)) {
      nextErrors.plate = "Invalid plate. Example: 1234ABC";
    }

    const vin = (vehicleForm.vin || "").trim().toUpperCase();

    if (vin && !VIN_REGEX.test(vin)) {
      nextErrors.vin =
        "Invalid VIN. It must have 17 characters and no I/O/Q.";
    }

    if (!(vehicleForm.brand || "").trim()) {
      nextErrors.brand = "Required";
    }

    if (!(vehicleForm.model || "").trim()) {
      nextErrors.model = "Required";
    }

    const validFuelType = fuelTypes.some(
      (fuelType) => fuelType.value === vehicleForm.fuel_type
    );

    if (!vehicleForm.fuel_type || !validFuelType) {
      nextErrors.fuel_type = "Select a valid fuel type";
    }

    const year = Number(vehicleForm.year);
    const currentYear = new Date().getFullYear();

    if (
      vehicleForm.year !== "" &&
      (Number.isNaN(year) || year < 1900 || year > currentYear + 1)
    ) {
      nextErrors.year = `Between 1900 and ${currentYear + 1}`;
    }

    const mileage = Number(vehicleForm.mileage);

    if (
      vehicleForm.mileage !== "" &&
      (Number.isNaN(mileage) || mileage < 0)
    ) {
      nextErrors.mileage = "Must be zero or a positive number";
    }

    const powerHp = Number(vehicleForm.power_hp);

    if (
      vehicleForm.power_hp !== "" &&
      (Number.isNaN(powerHp) || powerHp < 0)
    ) {
      nextErrors.power_hp = "Must be zero or a positive number";
    }

    const engineCc = Number(vehicleForm.engine_cc);

    if (
      vehicleForm.engine_cc !== "" &&
      (Number.isNaN(engineCc) || engineCc < 0)
    ) {
      nextErrors.engine_cc = "Must be zero or a positive number";
    }

    if (vehicleForm.first_registration_date) {
      const registrationDate = new Date(
        `${vehicleForm.first_registration_date}T00:00:00`
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const vehicleYear = Number(vehicleForm.year);
      const registrationYear = registrationDate.getFullYear();

      if (
        Number.isNaN(registrationDate.getTime()) ||
        registrationDate > today
      ) {
        nextErrors.first_registration_date =
          "Registration date cannot be in the future";
      } else if (
        vehicleForm.year !== "" &&
        !Number.isNaN(vehicleYear) &&
        registrationYear < vehicleYear
      ) {
        nextErrors.first_registration_date =
          `Registration date cannot be earlier than the manufacturing year (${vehicleYear})`;
      }
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    onCreateVehicle(event);
  };

  return (
    <section>
      <h3 className="h5 fw-bold mb-3">Vehicle</h3>

      <div className="alert alert-light border rounded-4">
        <strong>Customer:</strong>{" "}
        {selectedCustomer ? getCustomerLabel(selectedCustomer) : "No customer selected"}
      </div>

      {errors.general && (
        <div className="alert alert-danger rounded-4">{errors.general}</div>
      )}

      {customerVehicles.length === 0 && !showVehicleForm && (
        <div className="alert alert-warning rounded-4">
          This customer has no vehicles yet. Add a vehicle to continue.
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="vehicle_id">
          Select existing vehicle
        </label>

        <select
          id="vehicle_id"
          name="vehicle_id"
          className="form-select py-2 px-3"
          value={selectedVehicle?.id || ""}
          onChange={onSelectVehicle}
          disabled={customerVehicles.length === 0 || isBusy}
        >
          <option value="">Select a vehicle</option>

          {customerVehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {getVehicleName(vehicle)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn btn-outline-dark mb-3"
        onClick={onToggleVehicleForm}
        disabled={isBusy}
      >
        {showVehicleForm ? "Cancel new vehicle" : "+ Add new vehicle"}
      </button>

      {showVehicleForm && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="card mb-3">
            <div className="card-header">
              <strong>Vehicle data</strong>
            </div>

            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Plate *</label>
                  <input
                    type="text"
                    name="plate"
                    className={`form-control text-uppercase ${errors.plate ? "is-invalid" : ""}`}
                    placeholder="1234ABC"
                    maxLength={7}
                    value={vehicleForm.plate}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                  {errors.plate && (
                    <div className="invalid-feedback">{errors.plate}</div>
                  )}
                </div>

                <div className="col-md-8">
                  <label className="form-label">VIN / Chassis number</label>
                  <input
                    type="text"
                    name="vin"
                    className={`form-control text-uppercase ${errors.vin ? "is-invalid" : ""}`}
                    placeholder="17 characters"
                    maxLength={17}
                    value={vehicleForm.vin}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                  {errors.vin && (
                    <div className="invalid-feedback">{errors.vin}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    className={`form-control ${errors.brand ? "is-invalid" : ""}`}
                    placeholder="Example: Mazda"
                    value={vehicleForm.brand}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                  {errors.brand && (
                    <div className="invalid-feedback">{errors.brand}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">Model *</label>
                  <input
                    type="text"
                    name="model"
                    className={`form-control ${errors.model ? "is-invalid" : ""}`}
                    placeholder="Example: 6"
                    value={vehicleForm.model}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                  {errors.model && (
                    <div className="invalid-feedback">{errors.model}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">Version</label>
                  <input
                    type="text"
                    name="version"
                    className="form-control"
                    placeholder="Example: 2.0 Skyactiv"
                    value={vehicleForm.version}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    name="year"
                    className={`form-control ${errors.year ? "is-invalid" : ""}`}
                    min="1900"
                    max="2100"
                    value={vehicleForm.year}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                  {errors.year && (
                    <div className="invalid-feedback">{errors.year}</div>
                  )}
                </div>

                <div className="col-md-3">
                  <label className="form-label">Fuel type *</label>
                  <select
                    name="fuel_type"
                    className="form-select"
                    value={vehicleForm.fuel_type}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  >
                    {fuelTypes.map((fuelType) => (
                      <option key={fuelType.value} value={fuelType.value}>
                        {fuelType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label">Power HP</label>
                  <input
                    type="number"
                    name="power_hp"
                    min="0"
                    className="form-control"
                    value={vehicleForm.power_hp}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Engine CC</label>
                  <input
                    type="number"
                    name="engine_cc"
                    min="0"
                    className="form-control"
                    value={vehicleForm.engine_cc}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Color</label>
                  <input
                    type="text"
                    name="color"
                    className="form-control"
                    value={vehicleForm.color}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Mileage</label>
                  <input
                    type="number"
                    name="mileage"
                    min="0"
                    className={`form-control ${errors.mileage ? "is-invalid" : ""}`}
                    value={vehicleForm.mileage}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                  {errors.mileage && (
                    <div className="invalid-feedback">{errors.mileage}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">First registration date</label>
                  <input
                    type="date"
                    name="first_registration_date"
                    className="form-control"
                    value={vehicleForm.first_registration_date}
                    onChange={handleFieldChange}
                    disabled={isSavingVehicle}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-dark fw-bold"
              disabled={isSavingVehicle}
            >
              {isSavingVehicle ? (
                <ButtonSpinner text="Saving vehicle..." />
              ) : (
                "Save vehicle"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setErrors({});
                onClearVehicleForm();
              }}
              disabled={isSavingVehicle}
            >
              Clear
            </button>
          </div>
        </form>
      )}

      <div className="d-flex justify-content-between mt-4">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onBack}
          disabled={isBusy}
        >
          Back to customer
        </button>

        <button
          type="button"
          className="btn btn-dark fw-bold"
          onClick={onContinue}
          disabled={!selectedVehicle || isBusy}
        >
          Continue to service
        </button>
      </div>
    </section>
  );
};
