import React from "react";

const getStoredItem = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

export const WorkshopSummary = () => {
  const workshop = getStoredItem("workshop");
  const employee = getStoredItem("employee");

  if (!workshop) return null;

  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <small className="text-muted d-block mb-1">
              Current workshop
            </small>

            <h4 className="mb-1">
              {workshop.company_name}
            </h4>

            <p className="text-muted mb-0">
              {workshop.address || "No address available"}
            </p>
          </div>

          <div className="text-md-end">
            <span className="badge bg-warning text-dark mb-2">
              {employee?.role || "user"}
            </span>

            <p className="mb-0 fw-semibold">
              {employee?.first_name} {employee?.last_name}
            </p>

            <small className="text-muted">
              {workshop.email}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};