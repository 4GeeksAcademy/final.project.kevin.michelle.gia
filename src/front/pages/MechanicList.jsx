import { useEffect, useMemo, useState } from "react";
import {
    Wrench, Search, Plus, Copy, FileSpreadsheet, FileText,
    TableProperties, Eye, FilterX, Menu, Pencil, Trash2,
    MapPin, Briefcase
} from "lucide-react";
import { apiFetch } from "../services/api";
import "./Mechanic-List.css";

const INITIAL_FILTERS = {
    name: "",
    email: "",
    phone: ""
};

const INITIAL_VISIBILITY = {
    name: true,
    email: true,
    phone: true,
    actions: true
};

const initialFormState = {
    id: null,
    first_name: "",
    last_name: "",
    dni: "",
    phone: "",
    email: "",
    address: "",
    specialty: "",
    temporary_password: "",
    confirm_password: ""
};

function normalizeMechanic(mechanic) {
    return {
        ...mechanic,
        id: mechanic.id,
        first_name: mechanic.first_name || "",
        last_name: mechanic.last_name || "",
        full_name: `${mechanic.first_name || ""} ${mechanic.last_name || ""}`.trim(),
        dni: mechanic.dni || "",
        phone: mechanic.phone || "",
        email: mechanic.email || "",
        address: mechanic.address || "",
        specialty: mechanic.specialty || "",
        active: mechanic.is_active !== false
    };
}

export default function MechanicList() {
    const [data, setData] = useState([]);
    const [globalSearch, setGlobalSearch] = useState("");
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const [columnFilters, setColumnFilters] = useState(INITIAL_FILTERS);
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBILITY);

    const [showModal, setShowModal] = useState(false);
    const [selectedMechanic, setSelectedMechanic] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [mechanicForm, setMechanicForm] = useState(initialFormState);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadMechanics();
    }, []);

    const loadMechanics = async () => {
        setLoading(true);
        setError("");

        try {
            const payload = await apiFetch("/mechanics");
            setData((payload.mechanics || []).map(normalizeMechanic));
        } catch (err) {
            setError(err.message || "Could not load mechanics.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        const mechanic = data.find((item) => item.id === id);
        if (!mechanic) return;

        try {
            const payload = await apiFetch(`/mechanics/${id}`, {
                method: "PUT",
                body: { is_active: !mechanic.active }
            });
            const updated = normalizeMechanic(payload.mechanic || { ...mechanic, is_active: !mechanic.active });
            setData((prev) => prev.map((item) => (item.id === id ? updated : item)));
            setSelectedMechanic((prev) => (prev && prev.id === id ? updated : prev));
        } catch (err) {
            setError(err.message || "Could not update mechanic status.");
        }
    };

    const handleColumnFilterChange = (column, value) => {
        setColumnFilters((prev) => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    };

    const handleToggleColumn = (column) => {
        setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
    };

    const handleClearFilters = () => {
        setGlobalSearch("");
        setColumnFilters(INITIAL_FILTERS);
        setCurrentPage(1);
    };

    const filteredData = useMemo(() => {
        return data.filter((row) => {
            const matchesGlobal = Object.keys(row).some((key) =>
                String(row[key]).toLowerCase().includes(globalSearch.toLowerCase())
            );

            const matchesName = String(row.full_name || "").toLowerCase().includes(columnFilters.name.toLowerCase()) ||
                String(row.dni || "").toLowerCase().includes(columnFilters.name.toLowerCase());
            const matchesEmail = String(row.email || "").toLowerCase().includes(columnFilters.email.toLowerCase());
            const matchesPhone = String(row.phone || "").toLowerCase().includes(columnFilters.phone.toLowerCase());

            return matchesGlobal && matchesName && matchesEmail && matchesPhone;
        });
    }, [data, globalSearch, columnFilters]);

    const paginatedData = useMemo(() => {
        if (recordsPerPage === -1) return filteredData;
        const startIndex = (currentPage - 1) * recordsPerPage;
        return filteredData.slice(startIndex, startIndex + recordsPerPage);
    }, [filteredData, currentPage, recordsPerPage]);

    const totalPages = recordsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredData.length / recordsPerPage));

    const handleCloseModal = () => {
        setShowModal(false);
        setMechanicForm(initialFormState);
        setIsEditing(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleCloseViewModal = () => {
        setSelectedMechanic(null);
    };

    const handleOpenAddModal = () => {
        setMechanicForm(initialFormState);
        setIsEditing(false);
        setShowModal(true);
    };

    const handleOpenEditModal = (mechanic) => {
        setMechanicForm({
            id: mechanic.id,
            first_name: mechanic.first_name,
            last_name: mechanic.last_name,
            dni: mechanic.dni,
            phone: mechanic.phone,
            email: mechanic.email,
            address: mechanic.address || "",
            specialty: mechanic.specialty || "",
            temporary_password: "",
            confirm_password: ""
        });
        setIsEditing(true);
        setSelectedMechanic(null);
        setShowModal(true);
    };

    const handleRowClick = (event, mechanic) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.target.closest(".action-cell")) {
            return;
        }
        setSelectedMechanic(mechanic);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setMechanicForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveMechanic = async (event) => {
        event.preventDefault();

        if (!mechanicForm.first_name || !mechanicForm.last_name || !mechanicForm.dni || !mechanicForm.email) {
            alert("Please fill out all required fields.");
            return;
        }

        if (!isEditing && (!mechanicForm.temporary_password || mechanicForm.temporary_password !== mechanicForm.confirm_password)) {
            alert("Passwords do not match.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            if (isEditing) {
                const result = await apiFetch(`/mechanics/${mechanicForm.id}`, {
                    method: "PUT",
                    body: {
                        first_name: mechanicForm.first_name.trim(),
                        last_name: mechanicForm.last_name.trim(),
                        dni: mechanicForm.dni.trim(),
                        phone: mechanicForm.phone.trim(),
                        address: mechanicForm.address.trim(),
                        specialty: mechanicForm.specialty.trim()
                    }
                });
                const updated = normalizeMechanic(result.mechanic || { ...mechanicForm, id: mechanicForm.id, is_active: true });
                setData((prev) => prev.map((item) => (item.id === mechanicForm.id ? updated : item)));
            } else {
                const result = await apiFetch("/mechanics", {
                    method: "POST",
                    body: {
                        first_name: mechanicForm.first_name.trim(),
                        last_name: mechanicForm.last_name.trim(),
                        dni: mechanicForm.dni.trim(),
                        phone: mechanicForm.phone.trim(),
                        email: mechanicForm.email.trim(),
                        address: mechanicForm.address.trim(),
                        specialty: mechanicForm.specialty.trim(),
                        password: mechanicForm.temporary_password,
                        password_confirm: mechanicForm.confirm_password
                    }
                });
                const created = normalizeMechanic(result.employee || result.mechanic || { ...mechanicForm, id: Date.now(), is_active: true });
                setData((prev) => [created, ...prev]);
            }

            handleCloseModal();
        } catch (err) {
            setError(err.message || "Could not save mechanic.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRow = async (id, name) => {
        const confirmDelete = window.confirm(`Are you sure you want to deactivate mechanic ${name}?`);
        if (!confirmDelete) return;

        try {
            await apiFetch(`/mechanics/${id}`, { method: "DELETE" });
            setData((prev) => prev.filter((mech) => mech.id !== id));
            if (selectedMechanic && selectedMechanic.id === id) setSelectedMechanic(null);
        } catch (err) {
            setError(err.message || "Could not delete mechanic.");
        }
    };

    return (
        <>
            <header className="bg-orange-600 text-white d-flex align-items-center px-4 shadow-sm" style={{ height: "56px", backgroundColor: "#e65100" }}>
                <button className="btn text-white p-2 border-0 d-flex align-items-center" aria-label="Open menu">
                    <Menu size={24} />
                </button>
            </header>

            <div className="container-fluid mt-4 px-4 app-mechanic-container">
                <div className="d-flex align-items-center mb-4">
                    <Wrench className="me-2 text-secondary" size={32} />
                    <h2 className="header-title m-0">Mechanic List</h2>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="row mb-3 g-2">
                    <div className="col-md-10">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <Search size={18} className="text-muted" />
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filter mechanics by any field"
                                value={globalSearch}
                                onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="col-md-2">
                        <button onClick={handleOpenAddModal} className="btn btn-orange w-100 d-flex align-items-center justify-content-center gap-1">
                            <Plus size={18} /> Add Mechanic
                        </button>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex gap-1 flex-wrap">
                        <button className="btn btn-orange-action btn-sm d-flex align-items-center gap-1"><Copy size={14} /> Copy</button>
                        <button className="btn btn-orange-action btn-sm d-flex align-items-center gap-1"><FileSpreadsheet size={14} /> Excel</button>
                        <button className="btn btn-orange-action btn-sm d-flex align-items-center gap-1"><FileText size={14} /> CSV</button>

                        <div className="position-relative">
                            <button onClick={() => setShowOptionsDropdown(!showOptionsDropdown)} className="btn btn-orange-action btn-sm d-flex align-items-center gap-1">
                                <TableProperties size={14} /> Table Options
                            </button>
                            {showOptionsDropdown && (
                                <div className="dropdown-menu show shadow p-2 position-absolute start-0 mt-1 backend-dropdown">
                                    <div className="dropdown-header px-2 py-1 fw-bold text-dark d-flex align-items-center gap-1">
                                        <Eye size={14} /> Show / Hide Columns
                                    </div>
                                    {Object.keys(visibleColumns).map((column) => (
                                        <label key={column} className="dropdown-item d-flex align-items-center gap-2 style-cursor">
                                            <input type="checkbox" className="form-check-input m-0" checked={visibleColumns[column]} onChange={() => handleToggleColumn(column)} />
                                            <span className="text-capitalize">{column}</span>
                                        </label>
                                    ))}
                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleClearFilters} className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger">
                                        <FilterX size={14} /> Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 text-muted-custom">
                        <span>Show</span>
                        <select className="form-select form-select-sm" value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={10}>10 records</option>
                            <option value={100}>100 records</option>
                            <option value={-1}>All records</option>
                        </select>
                    </div>
                </div>

                <div className="card shadow-sm table-card-wrapper" onClick={() => showOptionsDropdown && setShowOptionsDropdown(false)}>
                    <div className="card-body p-3 overflow-auto">
                        {loading ? (
                            <div className="text-center py-4">Loading mechanics…</div>
                        ) : (
                            <table className="table table-bordered align-middle m-0 mechanic-workshop-table">
                                <thead>
                                    <tr>
                                        {visibleColumns.name && <th>Name</th>}
                                        {visibleColumns.email && <th>Email</th>}
                                        {visibleColumns.phone && <th>Phone</th>}
                                        {visibleColumns.actions && <th style={{ width: "100px", textAlign: "center" }}>Actions</th>}
                                    </tr>
                                    <tr className="search-row">
                                        {visibleColumns.name && (
                                            <td><input type="text" className="form-control form-control-sm" placeholder="Search name or DNI" value={columnFilters.name} onChange={(e) => handleColumnFilterChange("name", e.target.value)} /></td>
                                        )}
                                        {visibleColumns.email && (
                                            <td><input type="text" className="form-control form-control-sm" placeholder="Search email" value={columnFilters.email} onChange={(e) => handleColumnFilterChange("email", e.target.value)} /></td>
                                        )}
                                        {visibleColumns.phone && (
                                            <td><input type="text" className="form-control form-control-sm" placeholder="Search phone" value={columnFilters.phone} onChange={(e) => handleColumnFilterChange("phone", e.target.value)} /></td>
                                        )}
                                        {visibleColumns.actions && <td></td>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((row) => (
                                            <tr key={row.id} className="mechanic-row" onClick={(e) => handleRowClick(e, row)}>
                                                {visibleColumns.name && (
                                                    <td>
                                                        <div className="mechanic-name">{row.full_name}</div>
                                                        <div className="mechanic-dni">DNI/NIE: {row.dni}</div>
                                                    </td>
                                                )}
                                                {visibleColumns.email && <td>{row.email}</td>}
                                                {visibleColumns.phone && <td>{row.phone}</td>}
                                                {visibleColumns.actions && (
                                                    <td className="text-center action-cell">
                                                        <button className="action-icon-btn action-edit me-2" onClick={(e) => { e.stopPropagation(); handleOpenEditModal(row); }} title="Edit Mechanic">
                                                            <Pencil size={18} fill="currentColor" />
                                                        </button>
                                                        <button className="action-icon-btn action-delete" onClick={(e) => { e.stopPropagation(); handleDeleteRow(row.id, row.full_name); }} title="Delete Mechanic">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="text-center py-4">No mechanics found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted">Showing {paginatedData.length} of {filteredData.length} entries</div>
                    <nav>
                        <ul className="pagination pagination-sm m-0">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage((prev) => prev - 1)}>Previous</button>
                            </li>
                            <li className="page-item active">
                                <button className="page-link">{currentPage}</button>
                            </li>
                            <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}>
                                <button className="page-link" onClick={() => setCurrentPage((prev) => prev + 1)}>Next</button>
                            </li>
                        </ul>
                    </nav>
                </div>

                {selectedMechanic && (
                    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-orange text-white" style={{ backgroundColor: "#e65100" }}>
                                    <h5 className="modal-title m-0 fw-bold text-white">Mechanic Details</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseViewModal}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="text-center mb-4">
                                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '80px', height: '80px' }}>
                                            <Wrench size={40} className="text-secondary" />
                                        </div>
                                        <h4 className="mb-0 fw-bold">{selectedMechanic.full_name}</h4>

                                        <button
                                            className={`btn btn-sm mt-2 ${selectedMechanic.active ? "btn-success" : "btn-danger"}`}
                                            onClick={() => handleToggleStatus(selectedMechanic.id)}
                                        >
                                            {selectedMechanic.active ? "● Active" : "○ Inactive"}
                                        </button>
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-12 border-bottom pb-2">
                                            <div className="text-muted small fw-semibold text-uppercase">Contact Information</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted small">DNI / NIE</div>
                                            <div className="fw-medium">{selectedMechanic.dni}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-muted small">Phone</div>
                                            <div className="fw-medium">{selectedMechanic.phone}</div>
                                        </div>
                                        <div className="col-12">
                                            <div className="text-muted small">Email</div>
                                            <div className="fw-medium">{selectedMechanic.email}</div>
                                        </div>
                                        <div className="col-12">
                                            <div className="text-muted small">Address</div>
                                            <div className="fw-medium d-flex align-items-center gap-1">
                                                <MapPin size={16} className="text-muted" />
                                                {selectedMechanic.address || "No address registered"}
                                            </div>
                                        </div>

                                        <div className="col-12 border-bottom pb-2 mt-4">
                                            <div className="text-muted small fw-semibold text-uppercase">Professional Data</div>
                                        </div>
                                        <div className="col-12">
                                            <div className="text-muted small">Specialty</div>
                                            <div className="fw-medium d-flex align-items-center gap-1">
                                                <Briefcase size={16} className="text-muted" />
                                                {selectedMechanic.specialty || "Not specified"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light p-3">
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseViewModal}>Close</button>
                                    <button type="button" className="btn btn-orange text-white" style={{ backgroundColor: "#ff5722" }} onClick={() => handleOpenEditModal(selectedMechanic)}>
                                        <Pencil size={16} className="me-1" /> Edit Information
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-orange text-white" style={{ backgroundColor: "#e65100" }}>
                                    <h5 className="modal-title m-0 fw-bold text-white">
                                        {isEditing ? "Edit mechanic account" : "Create mechanic account"}
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
                                </div>

                                <form onSubmit={handleSaveMechanic}>
                                    <div className="modal-body p-4">
                                        {!isEditing && (
                                            <div className="modal-subtitle">
                                                Create an account so the mechanic can log in and see their assigned services.
                                            </div>
                                        )}

                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold mb-1">First name</label>
                                                <input type="text" name="first_name" className="form-control" value={mechanicForm.first_name} onChange={handleInputChange} required />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold mb-1">Last name</label>
                                                <input type="text" name="last_name" className="form-control" value={mechanicForm.last_name} onChange={handleInputChange} required />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold mb-1">DNI / NIE</label>
                                            <input type="text" name="dni" className="form-control" value={mechanicForm.dni} onChange={handleInputChange} required />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold mb-1">Phone</label>
                                            <input type="text" name="phone" className="form-control" value={mechanicForm.phone} onChange={handleInputChange} />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold mb-1">Email</label>
                                            <input type="email" name="email" className="form-control" value={mechanicForm.email} onChange={handleInputChange} required />
                                            <div className="input-help-text">This is the email the mechanic will use to log in.</div>
                                        </div>

                                        {isEditing && (
                                            <>
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold mb-1">Address</label>
                                                    <input type="text" name="address" className="form-control" value={mechanicForm.address} onChange={handleInputChange} />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label fw-semibold mb-1">Specialty</label>
                                                    <input type="text" name="specialty" className="form-control" value={mechanicForm.specialty} onChange={handleInputChange} placeholder="e.g. Engine Repair, Electrician" />
                                                </div>
                                            </>
                                        )}

                                        {!isEditing && (
                                            <>
                                                <div className="mb-3 position-relative">
                                                    <label className="form-label fw-semibold mb-1">Temporary password</label>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        name="temporary_password"
                                                        className="form-control pe-5"
                                                        value={mechanicForm.temporary_password}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle-btn"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                                                    </button>
                                                </div>

                                                <div className="mb-3 position-relative">
                                                    <label className="form-label fw-semibold mb-1">Confirm password</label>
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        name="confirm_password"
                                                        className="form-control pe-5"
                                                        value={mechanicForm.confirm_password}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        className="password-toggle-btn"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        <i className={`fa-solid ${showConfirmPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="modal-footer d-flex bg-light p-3 border-top-0">
                                        <button type="submit" className="btn btn-orange text-white w-100 py-2 fw-bold" style={{ backgroundColor: "#ff5722", borderRadius: "8px" }} disabled={saving}>
                                            {saving ? "Saving..." : (isEditing ? "Save changes" : "Create mechanic")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}