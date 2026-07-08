import { useEffect, useMemo, useState } from "react";
import { Car, Search, Plus, Copy, FileSpreadsheet, FileText, TableProperties, Eye, FilterX, Menu, Pencil, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "../services/api";
import "./Vehicle-List.css";

const COLUMNS = [
    { key: "license_plate", label: "Plate" },
    { key: "vin", label: "VIN" },
    { key: "brand", label: "Brand" },
    { key: "model", label: "Model" },
    { key: "version", label: "Version" },
    { key: "year", label: "Year" },
    { key: "fuel", label: "Fuel" },
    { key: "power", label: "Power" },
    { key: "displacement", label: "Displacement" },
    { key: "color", label: "Color" },
    { key: "mileage", label: "Mileage" },
    { key: "registration_date", label: "Registration Date" },
    { key: "actions", label: "Actions" }
];

const INITIAL_VISIBILITY = {
    license_plate: true,
    vin: true,
    brand: true,
    model: true,
    version: true,
    year: false,
    fuel: false,
    power: false,
    displacement: false,
    color: false,
    mileage: false,
    registration_date: false,
    actions: true
};

const initialVehicleForm = {
    customer_id: "",
    plate: "",
    vin: "",
    brand: "",
    model: "",
    version: "",
    year: "",
    fuel_type: "gasoline",
    power_hp: "",
    engine_cc: "",
    color: "",
    mileage: "",
    first_registration_date: ""
};

function normalizeVehicle(vehicle) {
    return {
        id: vehicle.id,
        license_plate: vehicle.plate || "",
        vin: vehicle.vin || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        version: vehicle.version || "",
        year: vehicle.year || "",
        fuel: vehicle.fuel_type || "",
        power: vehicle.power_hp || "",
        displacement: vehicle.engine_cc || "",
        color: vehicle.color || "",
        mileage: vehicle.mileage || 0,
        registration_date: vehicle.first_registration_date ? vehicle.first_registration_date.split("T")[0] : "",
        customer_id: vehicle.customer_id || "",
        customer_name: vehicle.customer_name || "",
        active: vehicle.is_active !== false
    };
}

export default function VehicleList() {
    const [data, setData] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [globalSearch, setGlobalSearch] = useState("");
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBILITY);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formState, setFormState] = useState(initialVehicleForm);
    const [columnFilters, setColumnFilters] = useState(COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: "" }), {}));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        setLoading(true);
        setError("");

        try {
            const [vehiclesPayload, customersPayload] = await Promise.all([
                apiFetch("/vehicles"),
                apiFetch("/customers")
            ]);
            setData((vehiclesPayload.vehicles || []).map(normalizeVehicle));
            setCustomers(customersPayload.customers || []);
        } catch (err) {
            setError(err.message || "Could not load vehicles.");
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vehicles");
        XLSX.writeFile(wb, "Vehicles.xlsx");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        alert("Data copied to clipboard!");
    };

    const handleOpenAddModal = () => {
        setEditingVehicle(null);
        setFormState(initialVehicleForm);
        setShowModal(true);
    };

    const handleOpenEditModal = (vehicle) => {
        setEditingVehicle(vehicle);
        setFormState({
            customer_id: vehicle.customer_id || "",
            plate: vehicle.license_plate || "",
            vin: vehicle.vin || "",
            brand: vehicle.brand || "",
            model: vehicle.model || "",
            version: vehicle.version || "",
            year: vehicle.year || "",
            fuel_type: vehicle.fuel || "gasoline",
            power_hp: vehicle.power || "",
            engine_cc: vehicle.displacement || "",
            color: vehicle.color || "",
            mileage: vehicle.mileage || "",
            first_registration_date: vehicle.registration_date || ""
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingVehicle(null);
        setFormState(initialVehicleForm);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formState.customer_id || !formState.plate || !formState.brand || !formState.model || !formState.fuel_type) {
            alert("Please fill out the required vehicle fields.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const body = {
                customer_id: Number(formState.customer_id),
                plate: formState.plate.trim(),
                vin: formState.vin.trim(),
                brand: formState.brand.trim(),
                model: formState.model.trim(),
                version: formState.version.trim(),
                year: formState.year ? Number(formState.year) : null,
                fuel_type: formState.fuel_type,
                power_hp: formState.power_hp ? Number(formState.power_hp) : null,
                engine_cc: formState.engine_cc ? Number(formState.engine_cc) : null,
                color: formState.color.trim(),
                mileage: formState.mileage ? Number(formState.mileage) : 0,
                first_registration_date: formState.first_registration_date || null
            };

            const path = editingVehicle ? `/vehicles/${editingVehicle.id}` : "/vehicles";
            const result = await apiFetch(path, { method: editingVehicle ? "PUT" : "POST", body });
            const saved = normalizeVehicle(result.vehicle || { ...body, id: editingVehicle?.id || Date.now() });

            if (editingVehicle) {
                setData((prev) => prev.map((item) => (item.id === editingVehicle.id ? saved : item)));
            } else {
                setData((prev) => [saved, ...prev]);
            }

            handleCloseModal();
        } catch (err) {
            setError(err.message || "Could not save vehicle.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

        try {
            await apiFetch(`/vehicles/${id}`, { method: "DELETE" });
            setData((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            setError(err.message || "Could not delete vehicle.");
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
        setColumnFilters(COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: "" }), {}));
        setCurrentPage(1);
    };

    const filteredData = useMemo(() => {
        return data.filter((row) => {
            const matchesGlobal = Object.values(row).some((val) =>
                String(val).toLowerCase().includes(globalSearch.toLowerCase())
            );
            const matchesFilters = Object.keys(columnFilters).every((key) =>
                !columnFilters[key] || String(row[key] || "").toLowerCase().includes(columnFilters[key].toLowerCase())
            );
            return matchesGlobal && matchesFilters;
        });
    }, [data, globalSearch, columnFilters]);

    const paginatedData = useMemo(() => {
        if (recordsPerPage === -1) return filteredData;
        const startIndex = (currentPage - 1) * recordsPerPage;
        return filteredData.slice(startIndex, startIndex + recordsPerPage);
    }, [filteredData, currentPage, recordsPerPage]);

    const totalPages = recordsPerPage === -1 ? 1 : Math.max(1, Math.ceil(filteredData.length / recordsPerPage));

    return (
        <div className="d-flex flex-column h-100">

            <div className="container-fluid mt-4 px-4 app-vehicle-container">
                <div className="d-flex align-items-center mb-4">
                    <Car className="me-2 text-secondary" size={32} />
                    <h2 className="header-title m-0">Vehicle List</h2>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="row mb-3 g-2">
                    <div className="col-md-10">
                        <div className="input-group">
                            <span className="input-group-text bg-white"><Search size={18} className="text-muted" /></span>
                            <input type="text" className="form-control" placeholder="Search vehicles by any field" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
                        </div>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-yellow w-100 fw-bold" onClick={handleOpenAddModal}><Plus size={18} /> Add Vehicle</button>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex gap-2 mb-3">
                        <button onClick={copyToClipboard} className="btn btn-orange-action btn-sm"><Copy size={14} /> Copy</button>
                        <button onClick={exportToExcel} className="btn btn-orange-action btn-sm"><FileSpreadsheet size={14} /> Excel</button>
                        <button className="btn btn-orange-action btn-sm"><FileText size={14} /> CSV</button>

                        <div className="position-relative">
                            <button onClick={() => setShowOptionsDropdown(!showOptionsDropdown)} className="btn btn-orange-action btn-sm"><TableProperties size={14} /> Table Options</button>
                            {showOptionsDropdown && (
                                <div className="dropdown-menu show shadow p-2 position-absolute start-0 mt-1 backend-dropdown">
                                    <div className="fw-bold p-1"><Eye size={14} /> Show / Hide Columns</div>
                                    {COLUMNS.filter((col) => col.key !== "actions").map((col) => (
                                        <label key={col.key} className="dropdown-item style-cursor">
                                            <input type="checkbox" checked={visibleColumns[col.key]} onChange={() => handleToggleColumn(col.key)} /> {col.label}
                                        </label>
                                    ))}
                                    <button onClick={handleClearFilters} className="dropdown-item text-danger"><FilterX size={14} /> Clear Filters</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <select className="form-select form-select-sm w-auto" value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={10}>10 records</option>
                        <option value={100}>100 records</option>
                        <option value={500}>500 records</option>
                        <option value={-1}>All records</option>
                    </select>
                </div>

                <div className="card shadow-sm vehicle-card-wrapper">
                    <div className="card-body p-3 overflow-auto">
                        {loading ? (
                            <div className="text-center py-4">Loading vehicles…</div>
                        ) : (
                            <table className="table table-bordered align-middle m-0 vehicle-workshop-table">
                                <thead>
                                    <tr>
                                        {COLUMNS.map((col) => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                                    </tr>
                                    <tr className="search-row">
                                        {COLUMNS.map((col) => visibleColumns[col.key] && (
                                            <td key={`search-${col.key}`}>
                                                {col.key !== "actions" && (
                                                    <input type="text" className="form-control form-control-sm" placeholder={`Search ${col.label.toLowerCase()}`} value={columnFilters[col.key]} onChange={(e) => handleColumnFilterChange(col.key, e.target.value)} />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((row) => (
                                        <tr key={row.id}>
                                            {visibleColumns.license_plate && <td>{row.license_plate}</td>}
                                            {visibleColumns.vin && <td>{row.vin}</td>}
                                            {visibleColumns.brand && <td>{row.brand}</td>}
                                            {visibleColumns.model && <td>{row.model}</td>}
                                            {visibleColumns.version && <td>{row.version}</td>}
                                            {visibleColumns.year && <td>{row.year}</td>}
                                            {visibleColumns.fuel && <td>{row.fuel}</td>}
                                            {visibleColumns.power && <td>{row.power} CV</td>}
                                            {visibleColumns.displacement && <td>{row.displacement} cc</td>}
                                            {visibleColumns.color && <td>{row.color}</td>}
                                            {visibleColumns.mileage && <td>{row.mileage} km</td>}
                                            {visibleColumns.registration_date && <td>{row.registration_date}</td>}
                                            {visibleColumns.actions && (
                                                <td className="text-center">
                                                    <button className="action-icon-btn action-edit" onClick={() => handleOpenEditModal(row)}>
                                                        <Pencil size={18} fill="currentColor" />
                                                    </button>
                                                    <button className="action-icon-btn action-delete" onClick={() => handleDelete(row.id)}><Trash2 size={18} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted">Showing {paginatedData.length} of {filteredData.length} entries</div>
                    <nav>
                        <ul className="pagination pagination-sm m-0">
                            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}><button className="page-link" onClick={() => setCurrentPage((prev) => prev - 1)}>Previous</button></li>
                            <li className="page-item active"><button className="page-link">{currentPage}</button></li>
                            <li className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}><button className="page-link" onClick={() => setCurrentPage((prev) => prev + 1)}>Next</button></li>
                        </ul>
                    </nav>
                </div>
            </div>

            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header d-flex justify-content-between align-items-center p-3 border-bottom">
                                <h5 className="text-dark m-0">{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</h5>
                                <button className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="modal-body p-4 row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Customer</label>
                                        <select className="form-select" name="customer_id" value={formState.customer_id} onChange={handleInputChange} required>
                                            <option value="">Select customer</option>
                                            {customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>{`${customer.first_name} ${customer.last_name}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Plate</label>
                                        <input className="form-control" name="plate" value={formState.plate} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">VIN</label>
                                        <input className="form-control" name="vin" value={formState.vin} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Brand</label>
                                        <input className="form-control" name="brand" value={formState.brand} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Model</label>
                                        <input className="form-control" name="model" value={formState.model} onChange={handleInputChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Version</label>
                                        <input className="form-control" name="version" value={formState.version} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Year</label>
                                        <input className="form-control" name="year" type="number" value={formState.year} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Fuel</label>
                                        <select className="form-select" name="fuel_type" value={formState.fuel_type} onChange={handleInputChange}>
                                            <option value="gasoline">Gasoline</option>
                                            <option value="diesel">Diesel</option>
                                            <option value="hybrid">Hybrid</option>
                                            <option value="plug_in_hybrid">Plug-in hybrid</option>
                                            <option value="electric">Electric</option>
                                            <option value="lpg">LPG</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Power (HP)</label>
                                        <input className="form-control" name="power_hp" type="number" value={formState.power_hp} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Engine CC</label>
                                        <input className="form-control" name="engine_cc" type="number" value={formState.engine_cc} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Color</label>
                                        <input className="form-control" name="color" value={formState.color} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Mileage</label>
                                        <input className="form-control" name="mileage" type="number" value={formState.mileage} onChange={handleInputChange} />
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label">First Registration Date</label>
                                        <input className="form-control" name="first_registration_date" type="date" value={formState.first_registration_date} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="modal-footer d-flex bg-light p-3 border-top-0">
                                    <button type="button" className="btn btn-dark" onClick={handleCloseModal}>
                                            Cancel
                                        </button>
                                    <button type="submit" className="btn btn-changed fw-bold" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
