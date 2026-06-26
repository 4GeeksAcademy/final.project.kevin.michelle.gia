import { useEffect, useState } from "react";
import "./ServiceStatusBoard.css";


const API_BASE_URL = import.meta.env.VITE_BACKEND_URL + "/api";


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


const STATUS_ACTIONS = {
  pending: {
    label: "Start repair",
    nextStatus: "in_repair",
  },

  diagnosis: {
    label: "Start repair",
    nextStatus: "in_repair",
  },

  budget_pending: {
    label: "Waiting parts",
    nextStatus: "waiting_parts",
  },

  waiting_parts: {
    label: "Start repair",
    nextStatus: "in_repair",
  },

  in_repair: {
    label: "Ready for pickup",
    nextStatus: "ready_to_deliver",
  },

  ready_to_deliver: {
    label: "Mark as delivered",
    nextStatus: "delivered",
  },
};


function buildUrl(path) {
  return API_BASE_URL + path;
}


function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "No date";
  }

  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}


function normalizeAdminServices(servicesByStatus) {
  if (!servicesByStatus) {
    return [];
  }

  let finalServices = [];

  Object.entries(servicesByStatus).forEach(([status, services]) => {
    services.forEach((service) => {
      finalServices.push({
        ...service,
        status: service.status || status,
      });
    });
  });

  return finalServices;
}



export function ServiceStatusBoard({ role = "admin" }) {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState("");

  const isMechanic = role === "mechanic";


  async function fetchServices() {
    try {
      setIsLoading(true);
      setError("");

      let endpoint = "/admin/dashboard";

      if (isMechanic) {
        endpoint = "/mechanic/services";
      }

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
        setStats(data.stats || null);
      } else {
        const adminServices = normalizeAdminServices(data.services_by_status);

        setServices(adminServices);
        setStats(data.stats || null);
      }

    } catch (error) {
      setError(error.message);

    } finally {
      setIsLoading(false);
    }
  }


  useEffect(() => {
    fetchServices();
  }, [role]);


  function getServicesByColumn(column) {
    return services.filter((service) => {
      return column.statuses.includes(service.status);
    });
  }


  async function updateServiceStatus(serviceId, nextStatus) {
    try {
      setActionLoadingId(serviceId);
      setError("");

      const response = await fetch(buildUrl("/services/" + serviceId + "/status"), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: nextStatus,
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

    if (!message || !message.trim()) {
      return;
    }

    try {
      setActionLoadingId(serviceId);
      setError("");

      const response = await fetch(buildUrl("/services/" + serviceId + "/notify-admin"), {
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


  if (isLoading) {
    return <p className="status-board-message">Loading services...</p>;
  }


  return (
    <section className="status-board">

      <div className="status-board-header">
        <div>
          <p className="status-board-kicker">
            {isMechanic ? "Mechanic dashboard" : "Coordinator dashboard"}
          </p>

          <h2>Workshop status board</h2>
        </div>

        <button className="refresh-button" type="button" onClick={fetchServices}>
          Refresh
        </button>
      </div>


      {error && <p className="status-board-error">{error}</p>}


      {stats && (
        <div className="status-board-stats">
          {Object.entries(stats).map(([key, value]) => (
            <article className="status-stat-card" key={key}>
              <span>{key.replaceAll("_", " ")}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      )}


      <div className="status-board-columns">

        {BOARD_COLUMNS.map((column) => {
          const columnServices = getServicesByColumn(column);

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
                    const action = STATUS_ACTIONS[service.status];

                    return (
                      <article className="service-card" key={service.id}>

                        <div className="service-card-top">
                          <span className={`status-pill status-${service.status}`}>
                            {STATUS_LABELS[service.status] || service.status}
                          </span>

                          <span className={`priority-pill priority-${service.priority}`}>
                            {service.priority || "normal"}
                          </span>
                        </div>


                        <h4>{service.customer_name || "Unknown customer"}</h4>


                        <p className="vehicle-line">
                          {service.vehicle_brand} {service.vehicle_model}
                          {service.vehicle_plate ? " · " + service.vehicle_plate : ""}
                        </p>


                        <p className="service-title">{service.title}</p>


                        <div className="service-meta">
                          <span>Mechanic:</span>
                          <strong>{service.employee_name || "Unassigned"}</strong>
                        </div>


                        <div className="service-meta">
                          <span>Entry date:</span>
                          <strong>{formatDate(service.start_date)}</strong>
                        </div>


                        {service.observations && (
                          <p className="service-observations">{service.observations}</p>
                        )}


                        <div className="service-actions">

                          {action && (
                            <button
                              type="button"
                              className="primary-action"
                              disabled={actionLoadingId === service.id}
                              onClick={() => updateServiceStatus(service.id, action.nextStatus)}
                            >
                              {actionLoadingId === service.id ? "Updating..." : action.label}
                            </button>
                          )}


                          <button
                            type="button"
                            className="secondary-action"
                            disabled={actionLoadingId === service.id}
                            onClick={() => reportIssue(service.id)}
                          >
                            Report issue
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