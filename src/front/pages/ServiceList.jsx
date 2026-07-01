

import { useState, useEffect } from "react";
import { getServices, getServiceComments, getServiceStatusLog } from "../services/api";
import "../css/ServiceList.css"; 


const STATUS_MAP = {
    pending:     { label: "Pendiente",  badge: "warning" },
    in_progress: { label: "En curso",   badge: "info" },
    completed:   { label: "Completado", badge: "success" },
    cancelled:   { label: "Cancelado",  badge: "secondary" },
};

const PRIORITY_MAP = {
    low:    { label: "Baja",    badge: "light text-secondary" },
    normal: { label: "Normal",  badge: "primary" },
    high:   { label: "Alta",    badge: "warning" },
    urgent: { label: "Urgente", badge: "danger" },
};

const COMMENT_TYPE_MAP = {
    note:       { label: "Nota",        badge: "info" },
    diagnostic: { label: "Diagnóstico", badge: "primary" },
    parts:      { label: "Repuestos",   badge: "success" },
    issue:      { label: "Incidencia",  badge: "danger" },
};

const SERVICE_TYPE_LABELS = {
    oil_change:   "Cambio de aceite",
    filters:      "Filtros",
    brakes:       "Frenos",
    clutch:       "Embrague",
    timing_belt:  "Correa distribución",
    tires:        "Neumáticos",
    itv:          "ITV",
    general:      "Revisión general",
    electrical:   "Eléctrico",
    bodywork:     "Chapa y pintura",
    diagnosis:    "Diagnóstico",
    other:        "Otro",
};

const fmtDate = (iso) => {
    if (!iso) return "–";
    return new Date(iso).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const fmtDateTime = (iso) => {
    if (!iso) return "–";
    return new Date(iso).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};


const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: status, badge: "secondary" };
    return <span className={`badge bg-${s.badge}`}>{s.label}</span>;
};

const PriorityBadge = ({ priority }) => {
    const p = PRIORITY_MAP[priority] || { label: priority, badge: "secondary" };
    return <span className={`badge bg-${p.badge}`}>{p.label}</span>;
};


const ServiceItem = ({ service }) => {
    const [open, setOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [statusLog, setStatusLog] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailLoaded, setDetailLoaded] = useState(false);

    const toggle = async () => {
        setOpen(prev => !prev);
      
        if (!detailLoaded) {
            setLoadingDetail(true);
            try {
                const [c, l] = await Promise.all([
                    getServiceComments(service.id).catch(() => []),
                    getServiceStatusLog(service.id).catch(() => []),
                ]);
                setComments(c);
                setStatusLog(l);
                setDetailLoaded(true);
            } catch (_) {}
            setLoadingDetail(false);
        }
    };

    const st = STATUS_MAP[service.status] || { label: service.status };
    const typeLabel = SERVICE_TYPE_LABELS[service.service_type] || service.service_type;

    return (
        <div className="card mb-2 border-0 shadow-sm">
            <button
                className="btn btn-light w-100 text-start d-flex align-items-center gap-3 px-3 py-3 border-0 rounded-0"
                onClick={toggle}
                style={{ justifyContent: "space-between" }}
                aria-expanded={open}
            >
                <div className="flex-grow-1 min-width-0">
                    <div className="fw-medium text-truncate">{service.title}</div>
                    <small className="text-muted d-block text-truncate">
                        {service.vehicle_plate} · {service.vehicle_brand} {service.vehicle_model} · {service.customer_name}
                    </small>
                </div>

                <div className="d-flex gap-2 flex-shrink-0 align-items-center">
                    <StatusBadge status={service.status} />
                    <PriorityBadge priority={service.priority} />
                    <i
                        className="ti ti-chevron-down text-muted"
                        style={{
                            fontSize: 16,
                            transition: "transform .2s ease",
                            transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                    />
                </div>
            </button>

           
            {open && (
                <div className="card-body border-top">
                    {loadingDetail ? (
                        <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-secondary" />
                        </div>
                    ) : (
                        <>
                        
                            <div className="row g-3 mb-3">
                                <ServiceField label="Tipo" value={typeLabel} />
                                <ServiceField label="Mecánico" value={service.employee_name || "Sin asignar"} />
                                <ServiceField
                                    label="Km entrada"
                                    value={service.entry_mileage ? service.entry_mileage.toLocaleString("es-ES") + " km" : "–"}
                                />
                                <ServiceField label="Inicio" value={fmtDate(service.start_date)} />
                                <ServiceField label="Fin" value={fmtDate(service.end_date)} />
                                <ServiceField label="Cliente" value={service.customer_name} />
                            </div>

                            {service.description && (
                                <div className="mb-3">
                                    <small className="text-muted d-block mb-1">Descripción</small>
                                    <p className="mb-0 small">{service.description}</p>
                                </div>
                            )}

                            {service.observations && (
                                <div className="mb-3">
                                    <small className="text-muted d-block mb-1">Observaciones</small>
                                    <p className="mb-0 small">{service.observations}</p>
                                </div>
                            )}

                           
                            {statusLog.length > 0 && (
                                <div className="mb-3">
                                    <small className="text-muted text-uppercase fw-bold d-block mb-2">
                                        Historial de estado
                                    </small>
                                    <div className="d-flex flex-column gap-2">
                                        {statusLog.map((l, i) => (
                                            <div key={i} className="d-flex align-items-start gap-2 small text-muted">
                                                <span
                                                    style={{
                                                        width: 6,
                                                        height: 6,
                                                        borderRadius: "50%",
                                                        background: "currentColor",
                                                        flexShrink: 0,
                                                        marginTop: 5,
                                                    }}
                                                />
                                                <span>
                                                    {l.from_status && (
                                                        <>
                                                            <StatusBadge status={l.from_status} /> →{" "}
                                                        </>
                                                    )}
                                                    <StatusBadge status={l.to_status} />
                                                    <br />
                                                    <small>
                                                        {fmtDateTime(l.changed_at)} {l.changed_by && `por ${l.changed_by}`}
                                                        {l.note && ` – "${l.note}"`}
                                                    </small>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                           
                            <div>
                                <small className="text-muted text-uppercase fw-bold d-block mb-2">
                                    Comentarios ({comments.length})
                                </small>
                                {comments.length === 0 ? (
                                    <small className="text-muted">Sin comentarios registrados</small>
                                ) : (
                                    <div className="d-flex flex-column gap-2">
                                        {comments.map(c => {
                                            const ct = COMMENT_TYPE_MAP[c.comment_type] || { label: c.comment_type };
                                            return (
                                                <div key={c.id} className="p-2 rounded-2 bg-light">
                                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                                        <div>
                                                            <small className="fw-medium">{c.author_name || "Sin autor"}</small>
                                                            <span className={`badge bg-${ct.badge} ms-2`} style={{ fontSize: 10 }}>
                                                                {ct.label}
                                                            </span>
                                                        </div>
                                                        <small className="text-muted">{fmtDateTime(c.created_at)}</small>
                                                    </div>
                                                    <p className="mb-0 small">{c.comment}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};


const ServiceField = ({ label, value }) => (
    <div className="col-6 col-md-4 col-lg-2">
        <small className="text-muted d-block mb-1">{label}</small>
        <span className="small fw-medium d-block">{value}</span>
    </div>
);


export const ServiceList = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        getServices()
            .then(setServices)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

   
    const visible = services.filter(s => {
        const matchFilter = filter === "all" || s.status === filter;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            s.title?.toLowerCase().includes(q) ||
            s.vehicle_plate?.toLowerCase().includes(q) ||
            s.vehicle_brand?.toLowerCase().includes(q) ||
            s.vehicle_model?.toLowerCase().includes(q) ||
            s.customer_name?.toLowerCase().includes(q) ||
            s.employee_name?.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const countByStatus = (key) =>
        key === "all" ? services.length : services.filter(s => s.status === key).length;

    return (
        <div className="container-fluid py-4">
          
            <div className="row mb-4">
                <div className="col">
                    <h1 className="h3 mb-0">Servicios</h1>
                    <small className="text-muted">{services.length} registrados</small>
                </div>
            </div>

            {error && <div className="alert alert-danger mb-3">{error}</div>}

          
            <div className="mb-3">
                <input
                    type="search"
                    className="form-control"
                    placeholder="Buscar por título, matrícula, cliente o mecánico..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

           
            <div className="d-flex gap-2 flex-wrap mb-3">
                {[
                    { key: "all", label: "Todos" },
                    { key: "pending", label: "Pendiente" },
                    { key: "in_progress", label: "En curso" },
                    { key: "completed", label: "Completado" },
                    { key: "cancelled", label: "Cancelado" },
                ].map(f => (
                    <button
                        key={f.key}
                        className={`btn btn-sm ${
                            filter === f.key ? "btn-primary" : "btn-outline-secondary"
                        }`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}{" "}
                        <span className={`badge ms-1 ${filter === f.key ? "bg-white text-primary" : "bg-secondary"}`}>
                            {countByStatus(f.key)}
                        </span>
                    </button>
                ))}
            </div>

         
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-secondary mb-3" />
                    <p className="text-muted small">Cargando servicios...</p>
                </div>
            ) : visible.length === 0 ? (
                <div className="alert alert-info text-center py-5 mb-0">
                    <p className="mb-0">No hay servicios que coincidan.</p>
                </div>
            ) : (
                <>
                    <p className="text-muted small mb-2">{visible.length} resultado{visible.length !== 1 ? "s" : ""}</p>
                    {visible.map(s => (
                        <ServiceItem key={s.id} service={s} />
                    ))}
                </>
            )}
        </div>
    );
};