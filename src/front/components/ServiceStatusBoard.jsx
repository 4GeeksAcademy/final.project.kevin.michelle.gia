import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Flag,
  CalendarDays,
  Pencil,
  UserRound,
  Wrench,
} from "lucide-react";
import "./ServiceStatusBoard.css";

const RAW_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001";

const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

const BOARD_COLUMNS = [
  {
    id: "pending",
    title: "Pending",
    statuses: ["pending"],
  },
  {
    id: "diagnosis",
    title: "Diagnosis",
    statuses: ["diagnosis", "budget_pending"],
  },
  {
    id: "waiting_parts",
    title: "Waiting parts",
    statuses: ["waiting_parts"],
  },
  {
    id: "in_repair",
    title: "In repair",
    statuses: ["in_repair"],
  },
  {
    id: "ready_to_deliver",
    title: "Ready to deliver",
    statuses: ["ready_to_deliver"],
  },
  {
    id: "delivered",
    title: "Delivered",
    statuses: ["delivered"],
  },
];

const STATUS_LABELS = {
  pending: "Pending",
  diagnosis: "Diagnosis",
  budget_pending: "Budget pending",
  waiting_parts: "Waiting parts",
  in_repair: "In repair",
  ready_to_deliver: "Ready to deliver",
  delivered: "Delivered",
};

const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const STATUS_FLOW_COLUMNS = BOARD_COLUMNS;

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function formatDate(dateValue) {
  if (!dateValue) return "No date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function normalizeAdminServices(servicesByStatus) {
  if (!servicesByStatus) return [];

  return Object.entries(servicesByStatus).flatMap(([status, services]) =>
    services.map((service) => ({
      ...service,
      status: service.status || status,
    }))
  );
}

function getColumnIndexByStatus(status) {
  return STATUS_FLOW_COLUMNS.findIndex((column) =>
    column.statuses.includes(status)
  );
}

function getMainStatusFromColumn(column) {
  return column?.statuses?.[0] || null;
}

function getPreviousStatus(status) {
  const currentColumnIndex = getColumnIndexByStatus(status);

  if (currentColumnIndex <= 0) {
    return null;
  }

  const previousColumn = STATUS_FLOW_COLUMNS[currentColumnIndex - 1];

  return getMainStatusFromColumn(previousColumn);
}

function getNextStatus(status) {
  const currentColumnIndex = getColumnIndexByStatus(status);

  if (
    currentColumnIndex === -1 ||
    currentColumnIndex >= STATUS_FLOW_COLUMNS.length - 1
  ) {
    return null;
  }

  const nextColumn = STATUS_FLOW_COLUMNS[currentColumnIndex + 1];

  return getMainStatusFromColumn(nextColumn);
}

function getColumnTitleByStatus(status) {
  const column = BOARD_COLUMNS.find((column) =>
    column.statuses.includes(status)
  );

  return column?.title || STATUS_LABELS[status] || status;
}

function getVehicleInfo(service) {
  const brand = service.vehicle_brand || "";
  const model = service.vehicle_model || "";
  const plate = service.vehicle_plate || "No plate";

  const vehicleName = `${brand} ${model}`.trim();

  return {
    name: vehicleName || "Unknown vehicle",
    plate,
  };
}

export function ServiceStatusBoard({ role = "admin" }) {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  const isMechanic = role === "mechanic";

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const endpoint = isMechanic ? "/mechanic/services" : "/admin/dashboard";

      const response = await fetch(buildUrl(endpoint), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not load services"
        );
      }

      if (isMechanic) {
        setServices(data.services || []);
      } else {
        setServices(normalizeAdminServices(data.services_by_status));
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [isMechanic]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const servicesByColumn = useMemo(() => {
    return BOARD_COLUMNS.reduce((acc, column) => {
      acc[column.id] = services.filter((service) =>
        column.statuses.includes(service.status)
      );

      return acc;
    }, {});
  }, [services]);

  async function updateServiceStatus(serviceId, newStatus) {
    try {
      setActionLoadingId(serviceId);
      setError("");

      const response = await fetch(buildUrl(`/services/${serviceId}/status`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          note: "Status updated from dashboard",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Could not update status"
        );
      }

      await fetchServices();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function reportIssue(serviceId) {
    const message = window.prompt("Describe the issue:");

    if (!message || !message.trim()) return;

    try {
      setActionLoadingId(serviceId);
      setError("");

      const response = await fetch(
        buildUrl(`/services/${serviceId}/notify-admin`),
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message: message.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Could not report issue");
      }

      await fetchServices();
    } catch (error) {
      setError(error.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  function goToServiceDetails(serviceId) {
    const path = isMechanic
      ? `/mechanic/services/${serviceId}`
      : `/admin/services/${serviceId}`;

    navigate(path);
  }

  if (isLoading) {
    return <p className="status-board-message">Loading services...</p>;
  }

  return (
    <section className="status-board">
      {error && <p className="status-board-error">{error}</p>}

      <div className="status-board-columns">
        {BOARD_COLUMNS.map((column) => {
          const columnServices = servicesByColumn[column.id] || [];

          return (
            <div className="status-column" key={column.id}>
              <div className="status-column-header">
                <h3>{column.title}</h3>
                <span>{columnServices.length}</span>
              </div>

              <div className="status-column-list">
                {columnServices.length === 0 ? (
                  <p className="empty-column">No services here.</p>
                ) : (
                  columnServices.map((service) => {
                    const previousStatus = getPreviousStatus(service.status);
                    const nextStatus = getNextStatus(service.status);
                    const isUpdating = actionLoadingId === service.id;
                    const vehicleInfo = getVehicleInfo(service);
                    const priority = service.priority || "normal";

                    return (
                      <article className="service-card" key={service.id}>
                        <div className="service-card-top">
                          <span
                            className={`status-pill status-${service.status}`}
                            title={
                              STATUS_LABELS[service.status] || service.status
                            }
                          >
                            <span className="pill-dot"></span>
                            <span className="pill-text">
                              {STATUS_LABELS[service.status] || service.status}
                            </span>
                          </span>

                          <span
                            className={`priority-pill priority-${priority}`}
                            title={PRIORITY_LABELS[priority] || priority}
                          >
                            <span className="pill-dot"></span>
                            <span className="pill-text">
                              {PRIORITY_LABELS[priority] || priority}
                            </span>
                          </span>
                        </div>

                        <div className="service-vehicle-block">
                          <h4 className="service-vehicle-title">
                            {vehicleInfo.name}
                          </h4>

                          <span className="service-plate-badge">
                            {vehicleInfo.plate}
                          </span>
                        </div>

                        <p className="service-title">
                          {service.title || "No service title"}
                        </p>

                        <div className="service-meta-list">
                          <div className="service-meta-row">
                            <UserRound size={14} />
                            <span>Customer</span>
                            <strong>
                              {service.customer_name || "Unknown customer"}
                            </strong>
                          </div>

                          <div className="service-meta-row">
                            <Wrench size={14} />
                            <span>Mechanic</span>
                            <strong>
                              {service.employee_name || "Unassigned"}
                            </strong>
                          </div>

                          <div className="service-meta-row">
                            <CalendarDays size={14} />
                            <span>Entry date</span>
                            <strong>{formatDate(service.start_date)}</strong>
                          </div>
                        </div>

                        {service.observations && (
                          <p className="service-observations">
                            {service.observations}
                          </p>
                        )}

                        <div className="service-card-actions">
                          <button
                            type="button"
                            className="details-link-button"
                            disabled={isUpdating}
                            onClick={() => goToServiceDetails(service.id)}
                          >
                            View details
                          </button>

                          <div className="service-icon-actions">
                            {isMechanic ? (
                              <button
                                type="button"
                                className="card-icon-action report-action"
                                title="Report issue to admin"
                                disabled={isUpdating}
                                onClick={() => reportIssue(service.id)}
                              >
                                <Flag size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="card-icon-action edit-action"
                                title="Edit service"
                                disabled={isUpdating}
                                onClick={() => goToServiceDetails(service.id)}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="service-status-actions">
                          <button
                            type="button"
                            className="status-icon-action previous-action"
                            title={
                              previousStatus
                                ? `Back to ${getColumnTitleByStatus(
                                    previousStatus
                                  )}`
                                : "No previous status"
                            }
                            disabled={!previousStatus || isUpdating}
                            onClick={() =>
                              updateServiceStatus(service.id, previousStatus)
                            }
                          >
                            <ArrowLeft size={16} />
                          </button>

                          <button
                            type="button"
                            className="status-icon-action next-action"
                            title={
                              nextStatus
                                ? `Move to ${getColumnTitleByStatus(
                                    nextStatus
                                  )}`
                                : "Final status"
                            }
                            disabled={!nextStatus || isUpdating}
                            onClick={() =>
                              updateServiceStatus(service.id, nextStatus)
                            }
                          >
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}