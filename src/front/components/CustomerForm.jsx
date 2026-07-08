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
        <form onSubmit={onCreateCustomer} className="border rounded-4 bg-light p-3">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_first_name">
                First name
              </label>

              <input
                id="customer_first_name"
                type="text"
                name="first_name"
                className="form-control py-2 px-3"
                value={customerForm.first_name}
                onChange={onCustomerFormChange}
                required
                disabled={isSavingCustomer}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_last_name">
                Last name
              </label>

              <input
                id="customer_last_name"
                type="text"
                name="last_name"
                className="form-control py-2 px-3"
                value={customerForm.last_name}
                onChange={onCustomerFormChange}
                required
                disabled={isSavingCustomer}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold" htmlFor="customer_dni">
                DNI / NIE
              </label>

              <input
                id="customer_dni"
                type="text"
                name="dni"
                className="form-control py-2 px-3"
                value={customerForm.dni}
                onChange={onCustomerFormChange}
                required
                disabled={isSavingCustomer}
              />
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
                onChange={onCustomerFormChange}
                required
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
                className="form-control py-2 px-3"
                value={customerForm.phone}
                onChange={onCustomerFormChange}
                required
                disabled={isSavingCustomer}
              />
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
                onChange={onCustomerFormChange}
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
                onChange={onCustomerFormChange}
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