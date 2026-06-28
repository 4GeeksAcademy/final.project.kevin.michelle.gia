import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, Flag, Pencil } from "lucide-react";
import "./ServiceStatusBoard.css";

const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001";

const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

const BOARD_COLUMNS = [
  {
    id: "to_repair",
    title: "Vehicles to repair",
    statuses: ["pending", "diagnosis", "budget_pending", "waiting_parts"],
  },
  {
    id: "in_progress",
    title: "In progress",
    statuses: ["in_repair"],
  },
  {
    id: "ready_for_pickup",
    title: "Ready for pickup",
    statuses: ["ready_to_deliver"],
  },
  {
    id: "finished",
    title: "Finished",
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
  cancelled: "Cancelled",
};

const STATUS_ORDER = [
  "pending",
  "diagnosis",
  "budget_pending",
  "waiting_parts",
  "in_repair",
  "ready_to_deliver",
  "delivered",
];

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

function getPreviousStatus(status) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  if (currentIndex <= 0) {
    return null;
  }

  return STATUS_ORDER[currentIndex - 1];
}

function getNextStatus(status) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  if (currentIndex === -1 || currentIndex >= STATUS_ORDER.length - 1) {
    return null;
  }

  return STATUS_ORDER[currentIndex + 1];
}

function getVehicleTitle(service) {
  const brand = service.vehicle_brand || "";
  const model = service.vehicle_model || "";
  const plate = service.vehicle_plate ? ` · ${service.vehicle_plate}` : "";

  const vehicleName = `${brand} ${model}`.trim();

  return `${vehicleName || "Unknown vehicle"}${plate}`;
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
        throw new Error(data.error || data.message || "Could not load services");
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
        throw new Error(data.error || data.message || "Could not update status");
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

      const response = await fetch(buildUrl(`/services/${serviceId}/notify-admin`), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: message.trim(),
        }),
      });

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

                    return (
                      <article className="service-card" key={service.id}>
                        <div className="service-card-top">
                          <span className={`status-pill status-${service.status}`}>
                            {STATUS_LABELS[service.status] || service.status}
                          </span>

                          <span
                            className={`priority-pill priority-${
                              service.priority || "normal"
                            }`}
                          >
                            {service.priority || "normal"}
                          </span>
                        </div>

                        <h4 className="service-vehicle-title">
                          {getVehicleTitle(service)}
                        </h4>

                        <p className="service-title">
                          {service.title || "No service title"}
                        </p>

                        <div className="service-meta">
                          <span>Customer</span>
                          <strong>{service.customer_name || "Unknown customer"}</strong>
                        </div>

                        <div className="service-meta">
                          <span>Mechanic</span>
                          <strong>{service.employee_name || "Unassigned"}</strong>
                        </div>

                        <div className="service-meta">
                          <span>Entry date</span>
                          <strong>{formatDate(service.start_date)}</strong>
                        </div>

                        {service.observations && (
                          <p className="service-observations">
                            {service.observations}
                          </p>
                        )}

                        <div className="service-card-actions">
                          <button
                            type="button"
                            className="card-action details-action icon-only-action"
                            title="Details"
                            disabled={isUpdating}
                            onClick={() => goToServiceDetails(service.id)}
                          >
                            <Eye size={16} />
                          </button>

                          {isMechanic ? (
                            <button
                              type="button"
                              className="card-action report-action icon-only-action"
                              title="Report issue"
                              disabled={isUpdating}
                              onClick={() => reportIssue(service.id)}
                            >
                              <Flag size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="card-action edit-action icon-only-action"
                              title="Edit service"
                              disabled={isUpdating}
                              onClick={() => goToServiceDetails(service.id)}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </div>

                        <div className="service-status-actions">
                          <button
                            type="button"
                            className="status-action previous-action icon-only-action"
                            title="Previous status"
                            disabled={!previousStatus || isUpdating}
                            onClick={() => updateServiceStatus(service.id, previousStatus)}
                          >
                            <ArrowLeft size={16} />
                          </button>

                          <button
                            type="button"
                            className="status-action next-action icon-only-action"
                            title="Next status"
                            disabled={!nextStatus || isUpdating}
                            onClick={() => updateServiceStatus(service.id, nextStatus)}
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
