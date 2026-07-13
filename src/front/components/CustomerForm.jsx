import { useState } from "react";

const PHONE_REGEX = /^\+?[0-9\s()-]{7,20}$/;
const DNI_REGEX = /^\d{8}[A-Z]$/;
const NIE_REGEX = /^[XYZ]\d{7}[A-Z]$/;

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

export function CustomerForm({
  customers,
  selectedCustomer,
  customerForm,
  showCustomerForm,
  isBusy,
  isSavingCustomer,
  onSelectCustomer,
  onCustomerFormChange,
  onCreateCustomer,
  onToggleCustomerForm,
  onContinue,
  getCustomerLabel
}) {

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

    if (name === "dni") {
      nextValue = value
        .replace(/[\s-]/g, "")
        .toUpperCase();
    }

    onCustomerFormChange({
      target: {
        name,
        value: nextValue,
        type
      }
    });
  };

  const validate = () => {
    const nextErrors = {};

    const firstName = (customerForm.first_name || "").trim();
    const lastName = (customerForm.last_name || "").trim();
    const phone = (customerForm.phone || "").trim();
    const dni = (customerForm.dni || "").replace(/[\s-]/g, "").toUpperCase();


    if (!firstName) {
      nextErrors.first_name = "Required";
    }

    if (!lastName) {
      nextErrors.last_name = "Required";
    }

    if (!phone) {
      nextErrors.phone = "Required";
    } else if (!PHONE_REGEX.test(phone)) {
      nextErrors.phone = "Invalid phone number";
    }
    if (dni && !DNI_REGEX.test(dni) && !NIE_REGEX.test(dni)) {
      nextErrors.dni =
        "Invalid DNI or NIE. Example: 12345678Z or X1234567L";
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
    onCreateCustomer(event);
  };

  return (
    <section>
      <h3 className="h5 fw-bold mb-3">Customer</h3>

      {customers.length === 0 && !showCustomerForm && (
        <div className="alert alert-warning rounded-4">
          No customers found. Create the first customer before creating the service ticket.
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-semibold" htmlFor="customer_id">
          Select existing customer
        </label>

        <select
          id="customer_id"
          className="form-select py-2 px-3"
          value={selectedCustomer?.id || ""}
          onChange={onSelectCustomer}
          disabled={customers.length === 0 || isBusy}
        >
          <option value="">Select a customer</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {getCustomerLabel(customer)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="btn btn-outline-dark mb-3"
        onClick={onToggleCustomerForm}
        disabled={isBusy}
      >
        {showCustomerForm ? "Cancel new customer" : "+ Add new customer"}
      </button>

      {showCustomerForm && (
        <form onSubmit={handleSubmit} noValidate className="border rounded-4 bg-light p-3">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_first_name">
                First name
              </label>

              <input
                id="customer_first_name"
                type="text"
                name="first_name"
                className={`form-control py-2 px-3 ${errors.first_name ? "is-invalid" : ""}`}
                value={customerForm.first_name}
                onChange={handleFieldChange}
                disabled={isSavingCustomer}
              />
              {errors.first_name && (
                <div className="invalid-feedback">
                  {errors.first_name}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_last_name">
                Last name
              </label>

              <input
                id="customer_last_name"
                type="text"
                name="last_name"
                className={`form-control py-2 px-3 ${errors.last_name ? "is-invalid" : ""}`}
                value={customerForm.last_name}
                onChange={handleFieldChange}
                disabled={isSavingCustomer}
              />
              {errors.last_name && (
                <div className="invalid-feedback">
                  {errors.last_name}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_dni">
                DNI / NIE
              </label>

              <input
                id="customer_dni"
                type="text"
                name="dni"
                className={`form-control py-2 px-3 text-uppercase ${errors.dni ? "is-invalid" : ""}`}
                placeholder="12345678Z or X1234567L"
                maxLength={9}
                value={customerForm.dni}
                onChange={handleFieldChange}
                disabled={isSavingCustomer}
              />
              {errors.dni && (
                <div className="invalid-feedback">
                  {errors.dni}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_driving_license">
                Driving license
              </label>

              <input
                id="customer_driving_license"
                type="text"
                name="driving_license"
                className="form-control py-2 px-3"
                value={customerForm.driving_license}
                onChange={handleFieldChange}
                disabled={isSavingCustomer}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_phone">
                Phone
              </label>

              <input
                id="customer_phone"
                type="tel"
                name="phone"
                className={`form-control py-2 px-3 ${errors.phone ? "is-invalid" : ""}`}
                value={customerForm.phone}
                onChange={handleFieldChange}
                disabled={isSavingCustomer}
              />
              {errors.phone && (
                <div className="invalid-feedback">
                  {errors.phone}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_email">
                Email
              </label>

              <input
                id="customer_email"
                type="email"
                name="email"
                className="form-control py-2 px-3"
                value={customerForm.email}
                onChange={handleFieldChange}
                disabled={isSavingCustomer}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold" htmlFor="customer_address">
                Address
              </label>

              <input
                id="customer_address"
                type="text"
                name="address"
                className="form-control py-2 px-3"
                value={customerForm.address}
                onChange={handleFieldChange}
                disabled={isSavingCustomer}
              />
            </div>

            <div className="col-12">
              <button
                type="submit"
                className="btn btn-dark fw-bold"
                disabled={isSavingCustomer}
              >
                {isSavingCustomer ? (
                  <ButtonSpinner text="Saving customer..." />
                ) : (
                  "Save customer"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="d-flex justify-content-end mt-4">
        <button
          type="button"
          className="btn btn-dark fw-bold"
          onClick={onContinue}
          disabled={!selectedCustomer || isBusy}
        >
          Continue to vehicle
        </button>
      </div>
    </section>
  );
}