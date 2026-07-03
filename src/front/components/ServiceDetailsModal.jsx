import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

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

const PRIORITY_LABELS = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const COMMENT_TYPE_OPTIONS = [
  { value: "note", label: "Note" },
  { value: "status_update", label: "Status update" },
  { value: "admin_alert", label: "Admin alert" },
];

const COMMENT_TYPE_LABELS = {
  note: "Note",
  status_update: "Status update",
  admin_alert: "Admin alert",
};

function formatDate(dateValue) {
  if (!dateValue) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function formatDateTime(dateValue) {
  if (!dateValue) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function InfoRow({ label, value }) {
  return (
    <div className="col-md-6 mb-3">
      <p className="mb-1 text-muted fw-semibold">{label}</p>
      <p className="mb-0">{value || "-"}</p>
    </div>
  );
}

export function ServiceDetailsModal({
  serviceId,
  role = "admin",
  onClose,
  onServiceUpdated,
}) {
  const [service, setService] = useState(null);
  const [comments, setComments] = useState([]);

  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("note");

  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState(false);
  const [error, setError] = useState("");

  const isMechanic = role === "mechanic";

  async function loadDetails() {
    try {
      setLoading(true);
      setError("");

      const [serviceData, commentsData] = await Promise.all([
        apiFetch(`/services/${serviceId}`),
        apiFetch(`/services/${serviceId}/comments`),
      ]);

      setService(serviceData.service || serviceData);
      setComments(commentsData.comments || []);
    } catch (error) {
      setError(error.message || "Could not load service details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetails();
  }, [serviceId]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  async function handleSubmitComment(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      setError("Please write a comment before saving.");
      return;
    }

    try {
      setSavingComment(true);
      setError("");

      await apiFetch(`/services/${serviceId}/comments`, {
        method: "POST",
        body: {
          comment: commentText.trim(),
          comment_type: commentType,
        },
      });

      setCommentText("");
      setCommentType("note");

      await loadDetails();

      if (onServiceUpdated) {
        onServiceUpdated();
      }
    } catch (error) {
      setError(error.message || "Could not save comment.");
    } finally {
      setSavingComment(false);
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onMouseDown={handleBackdropClick}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header bg-warning text-dark">
              <div>
                <p className="mb-0 small fw-bold">
                  {isMechanic ? "My Task" : "Service Details"}
                </p>

                <h5 className="modal-title fw-bold">
                  {service?.title || "Service"}
                </h5>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-warning" role="alert">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-warning mb-3"></div>
                  <p className="text-muted">Loading service details...</p>
                </div>
              ) : !service ? (
                <div className="alert alert-info">
                  Service not found.
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="d-flex gap-2 mb-3">
                      <strong className="badge bg-warning text-dark">
                        {STATUS_LABELS[service.status] || service.status}
                      </strong>

                      <strong className="badge bg-dark">
                        {PRIORITY_LABELS[service.priority] ||
                          service.priority ||
                          "Normal"}
                      </strong>
                    </div>

                    <p className="mb-0">
                      {service.description || "No description provided."}
                    </p>
                  </div>

                  <hr />

                  <div className="row">
                    <InfoRow
                      label="Vehicle"
                      value={`${service.vehicle_brand || ""} ${
                        service.vehicle_model || ""
                      }`.trim()}
                    />

                    <InfoRow label="Plate" value={service.vehicle_plate} />

                    <InfoRow label="Customer" value={service.customer_name} />

                    <InfoRow
                      label="Mechanic"
                      value={service.employee_name || "Unassigned"}
                    />

                    <InfoRow
                      label="Entry mileage"
                      value={
                        service.entry_mileage
                          ? `${service.entry_mileage} km`
                          : "-"
                      }
                    />

                    <InfoRow
                      label="Service type"
                      value={service.service_type}
                    />

                    <InfoRow
                      label="Start date"
                      value={formatDate(service.start_date)}
                    />

                    <InfoRow
                      label="End date"
                      value={formatDate(service.end_date)}
                    />
                  </div>

                  {service.observations && (
                    <>
                      <hr />

                      <div className="mb-4">
                        <h6 className="fw-bold">Observations</h6>
                        <p className="mb-0">{service.observations}</p>
                      </div>
                    </>
                  )}

                  <hr />

                  <div className="mb-4">
                    <h6 className="fw-bold">
                      Comments ({comments.length})
                    </h6>

                    {comments.length === 0 ? (
                      <p className="text-muted mb-0">
                        No comments yet.
                      </p>
                    ) : (
                      <div className="list-group">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="list-group-item"
                          >
                            <div className="d-flex justify-content-between mb-2">
                              <strong>
                                {comment.author_name || "Unknown author"}
                              </strong>

                              <p className="mb-0 small text-muted">
                                {formatDateTime(comment.created_at)}
                              </p>
                            </div>

                            <p className="mb-2 small text-muted">
                              {COMMENT_TYPE_LABELS[comment.comment_type] ||
                                comment.comment_type ||
                                "Note"}
                            </p>

                            <p className="mb-0">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmitComment}>
                    <div className="border rounded p-3 bg-light">
                      <h6 className="fw-bold mb-3">Add Comment</h6>

                      <div className="mb-3">
                        <label className="form-label">
                          Comment type
                        </label>

                        <select
                          className="form-select"
                          value={commentType}
                          onChange={(event) =>
                            setCommentType(event.target.value)
                          }
                          disabled={savingComment}
                        >
                          {COMMENT_TYPE_OPTIONS.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">
                          Comment
                        </label>

                        <textarea
                          className="form-control"
                          rows="3"
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(event) =>
                            setCommentText(event.target.value)
                          }
                          disabled={savingComment}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-warning fw-bold"
                        disabled={savingComment}
                      >
                        {savingComment ? "Saving..." : "Save comment"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop show"></div>
    </>
  );
}