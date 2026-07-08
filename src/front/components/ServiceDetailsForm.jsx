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

export function ServiceDetailsForm({
  selectedCustomer,
  selectedVehicle,
  mechanics,
  formData,
  isSavingService,
  onServiceFormChange,
  onSubmit,
  onBack,
  getCustomerLabel,
  getVehicleName,
  getMechanicLabel,
  serviceTypes,
  serviceStatuses,
  servicePriorities
}) {
  return (
    <section>
      <h3 className="h5 fw-bold mb-3">Service ticket</h3>

      <div className="alert alert-light border rounded-4">
        <p className="mb-1">
          <strong>Customer:</strong>{" "}
          {selectedCustomer ? getCustomerLabel(selectedCustomer) : "No customer selected"}
        </p>

        <p className="mb-0">
          <strong>Vehicle:</strong>{" "}
          {selectedVehicle ? getVehicleName(selectedVehicle) : "No vehicle selected"}
        </p>
      </div>

      {mechanics.length === 0 && (
        <div className="alert alert-warning rounded-4">
          No mechanics found. You can create the ticket unassigned, or create a mechanic account later.
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="employee_id">
              Assigned mechanic
            </label>

            <select
              id="employee_id"
              name="employee_id"
              className="form-select py-2 px-3"
              value={formData.employee_id}
              onChange={onServiceFormChange}
              disabled={mechanics.length === 0 || isSavingService}
            >
              <option value="">Unassigned</option>

              {mechanics.map((mechanic) => (
                <option key={mechanic.id} value={mechanic.id}>
                  {getMechanicLabel(mechanic)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="title">
              Title
            </label>

            <input
              id="title"
              type="text"
              name="title"
              className="form-control py-2 px-3"
              value={formData.title}
              onChange={onServiceFormChange}
              placeholder="Example: Engine diagnosis"
              required
              disabled={isSavingService}
            />
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label fw-semibold" htmlFor="service_type">
              Service type
            </label>

            <select
              id="service_type"
              name="service_type"
              className="form-select py-2 px-3"
              value={formData.service_type}
              onChange={onServiceFormChange}
              required
              disabled={isSavingService}
            >
              {serviceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label fw-semibold" htmlFor="status">
              Initial status
            </label>

            <select
              id="status"
              name="status"
              className="form-select py-2 px-3"
              value={formData.status}
              onChange={onServiceFormChange}
              disabled={isSavingService}
            >
              {serviceStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <label className="form-label fw-semibold" htmlFor="priority">
              Priority
            </label>

            <select
              id="priority"
              name="priority"
              className="form-select py-2 px-3"
              value={formData.priority}
              onChange={onServiceFormChange}
              disabled={isSavingService}
            >
              {servicePriorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              className="form-control py-2 px-3"
              value={formData.description}
              onChange={onServiceFormChange}
              rows="3"
              placeholder="Describe the customer complaint or the requested work."
              disabled={isSavingService}
            ></textarea>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="observations">
              Observations
            </label>

            <textarea
              id="observations"
              name="observations"
              className="form-control py-2 px-3"
              value={formData.observations}
              onChange={onServiceFormChange}
              rows="3"
              placeholder="Internal notes for the workshop team."
              disabled={isSavingService}
            ></textarea>
          </div>

          <div className="col-12 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onBack}
              disabled={isSavingService}
            >
              Back to vehicle
            </button>

            <button
              type="submit"
              className="btn btn-dark px-4 fw-bold"
              disabled={isSavingService}
            >
              {isSavingService ? (
                <ButtonSpinner text="Creating ticket..." />
              ) : (
                "Create service ticket"
              )}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}