import { useEffect, useMemo, useState } from "react";
import { Car, Search, Plus, Copy, FileSpreadsheet, FileText, TableProperties, Eye, FilterX, Menu, Pencil, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { apiFetch } from "../services/api";
import "./Vehicle-List.css";

const PLATE_REGEX = /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const VALID_FUEL_TYPES = [
  "gasoline",
  "diesel",
  "hybrid",
  "plug_in_hybrid",
  "electric",
  "lpg",
];

const normalizePlate = (value = "") =>
  value.replace(/[\s-]/g, "").toUpperCase();

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
  { key: "actions", label: "Actions" },
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
  actions: true,
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
  first_registration_date: "",
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
    registration_date: vehicle.first_registration_date
      ? vehicle.first_registration_date.split("T")[0]
      : "",
    customer_id: vehicle.customer_id || "",
    customer_name: vehicle.customer_name || "",
    active: vehicle.is_active !== false,
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
  const [columnFilters, setColumnFilters] = useState(
    COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: "" }), {}),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    setError("");

    try {
      const [vehiclesPayload, customersPayload] = await Promise.all([
        apiFetch("/vehicles"),
        apiFetch("/customers"),
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
    setFormErrors({});
    setEditingVehicle(null);
    setFormState(initialVehicleForm);
    setShowModal(true);
  };

  const handleOpenEditModal = (vehicle) => {
    setFormErrors({});
    setEditingVehicle(vehicle);
    setFormState({
      customer_id: vehicle.customer_id || "",
      plate: normalizePlate(vehicle.license_plate || ""),
      vin: (vehicle.vin || "").trim().toUpperCase(),
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      version: vehicle.version || "",
      year: vehicle.year || "",
      fuel_type: vehicle.fuel || "gasoline",
      power_hp: vehicle.power || "",
      engine_cc: vehicle.displacement || "",
      color: vehicle.color || "",
      mileage: vehicle.mileage || "",
      first_registration_date: vehicle.registration_date || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setFormErrors({});
    setShowModal(false);
    setEditingVehicle(null);
    setFormState(initialVehicleForm);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (formErrors[name]) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        [name]: undefined,
      }));
    }

    let nextValue = value;

    if (name === "plate") {
      nextValue = normalizePlate(value);
    }

    if (name === "vin") {
      nextValue = value.replace(/\s/g, "").toUpperCase();
    }

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: nextValue,
    }));
  };

  const validateVehicle = () => {
    const nextErrors = {};

    if (!formState.customer_id) {
      nextErrors.customer_id = "Select a customer";
    }

    const plate = normalizePlate(formState.plate || "");

    if (!plate) {
      nextErrors.plate = "Required";
    } else if (!PLATE_REGEX.test(plate)) {
      nextErrors.plate = "Invalid plate. Example: 1234ABC";
    }

    const vin = (formState.vin || "").trim().toUpperCase();

    if (vin && !VIN_REGEX.test(vin)) {
      nextErrors.vin = "Invalid VIN. It must have 17 characters and no I/O/Q.";
    }

    if (!(formState.brand || "").trim()) {
      nextErrors.brand = "Required";
    }

    if (!(formState.model || "").trim()) {
      nextErrors.model = "Required";
    }

    if (
      !formState.fuel_type ||
      !VALID_FUEL_TYPES.includes(formState.fuel_type)
    ) {
      nextErrors.fuel_type = "Select a valid fuel type";
    }

    const year = Number(formState.year);
    const currentYear = new Date().getFullYear();

    if (
      formState.year !== "" &&
      (Number.isNaN(year) || year < 1900 || year > currentYear + 1)
    ) {
      nextErrors.year = `Between 1900 and ${currentYear + 1}`;
    }

    const mileage = Number(formState.mileage);

    if (formState.mileage !== "" && (Number.isNaN(mileage) || mileage < 0)) {
      nextErrors.mileage = "Must be zero or a positive number";
    }

    const powerHp = Number(formState.power_hp);

    if (formState.power_hp !== "" && (Number.isNaN(powerHp) || powerHp < 0)) {
      nextErrors.power_hp = "Must be zero or a positive number";
    }

    const engineCc = Number(formState.engine_cc);

    if (
      formState.engine_cc !== "" &&
      (Number.isNaN(engineCc) || engineCc < 0)
    ) {
      nextErrors.engine_cc = "Must be zero or a positive number";
    }

    if (formState.first_registration_date) {
      const registrationDate = new Date(
        `${formState.first_registration_date}T00:00:00`,
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const vehicleYear = Number(formState.year);
      const registrationYear = registrationDate.getFullYear();

      if (
        Number.isNaN(registrationDate.getTime()) ||
        registrationDate > today
      ) {
        nextErrors.first_registration_date =
          "Registration date cannot be in the future";
      } else if (
        formState.year !== "" &&
        !Number.isNaN(vehicleYear) &&
        registrationYear < vehicleYear
      ) {
        nextErrors.first_registration_date = `Registration date cannot be earlier than the manufacturing year (${vehicleYear})`;
      }
    }

    return nextErrors;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const validationErrors = validateVehicle();

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    setFormErrors({});
    setSaving(true);
    setError("");

    try {
      const body = {
        customer_id: Number(formState.customer_id),
        plate: normalizePlate(formState.plate),
        vin: formState.vin.trim().toUpperCase(),
        brand: formState.brand.trim(),
        model: formState.model.trim(),
        version: formState.version.trim(),
        year: formState.year ? Number(formState.year) : null,
        fuel_type: formState.fuel_type,
        power_hp: formState.power_hp ? Number(formState.power_hp) : null,
        engine_cc: formState.engine_cc ? Number(formState.engine_cc) : null,
        color: formState.color.trim(),
        mileage: formState.mileage ? Number(formState.mileage) : 0,
        first_registration_date: formState.first_registration_date || null,
      };

      const path = editingVehicle
        ? `/vehicles/${editingVehicle.id}`
        : "/vehicles";

      const result = await apiFetch(path, {
        method: editingVehicle ? "PUT" : "POST",
        body,
      });

      const saved = normalizeVehicle(
        result.vehicle || {
          ...body,
          id: editingVehicle?.id || Date.now(),
        },
      );

      if (editingVehicle) {
        setData((prev) =>
          prev.map((item) => (item.id === editingVehicle.id ? saved : item)),
        );
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
    if (!window.confirm("Are you sure you want to delete this vehicle?"))
      return;

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
    setColumnFilters(
      COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: "" }), {}),
    );
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesGlobal = Object.values(row).some((val) =>
        String(val).toLowerCase().includes(globalSearch.toLowerCase()),
      );
      const matchesFilters = Object.keys(columnFilters).every(
        (key) =>
          !columnFilters[key] ||
          String(row[key] || "")
            .toLowerCase()
            .includes(columnFilters[key].toLowerCase()),
      );
      return matchesGlobal && matchesFilters;
    });
  }, [data, globalSearch, columnFilters]);

  const paginatedData = useMemo(() => {
    if (recordsPerPage === -1) return filteredData;
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredData.slice(startIndex, startIndex + recordsPerPage);
  }, [filteredData, currentPage, recordsPerPage]);

  const totalPages =
    recordsPerPage === -1
      ? 1
      : Math.max(1, Math.ceil(filteredData.length / recordsPerPage));

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
              <span className="input-group-text bg-white">
                <Search size={18} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search vehicles by any field"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-yellow w-100 fw-bold"
              onClick={handleOpenAddModal}
            >
              <Plus size={18} /> Add Vehicle
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div className="d-flex gap-2 mb-3">
            <button
              onClick={copyToClipboard}
              className="btn btn-orange-action btn-sm"
            >
              <Copy size={14} /> Copy
            </button>
            <button
              onClick={exportToExcel}
              className="btn btn-orange-action btn-sm"
            >
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button className="btn btn-orange-action btn-sm">
              <FileText size={14} /> CSV
            </button>

            <div className="position-relative">
              <button
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                className="btn btn-orange-action btn-sm"
              >
                <TableProperties size={14} /> Table Options
              </button>
              {showOptionsDropdown && (
                <div className="dropdown-menu show shadow p-2 position-absolute start-0 mt-1 backend-dropdown">
                  <div className="fw-bold p-1">
                    <Eye size={14} /> Show / Hide Columns
                  </div>
                  {COLUMNS.filter((col) => col.key !== "actions").map((col) => (
                    <label key={col.key} className="dropdown-item style-cursor">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key]}
                        onChange={() => handleToggleColumn(col.key)}
                      />{" "}
                      {col.label}
                    </label>
                  ))}
                  <button
                    onClick={handleClearFilters}
                    className="dropdown-item text-danger"
                  >
                    <FilterX size={14} /> Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
          <select
            className="form-select form-select-sm w-auto"
            value={recordsPerPage}
            onChange={(e) => {
              setRecordsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
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
                    {COLUMNS.map(
                      (col) =>
                        visibleColumns[col.key] && (
                          <th key={col.key}>{col.label}</th>
                        ),
                    )}
                  </tr>
                  <tr className="search-row">
                    {COLUMNS.map(
                      (col) =>
                        visibleColumns[col.key] && (
                          <td key={`search-${col.key}`}>
                            {col.key !== "actions" && (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={`Search ${col.label.toLowerCase()}`}
                                value={columnFilters[col.key]}
                                onChange={(e) =>
                                  handleColumnFilterChange(
                                    col.key,
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>
                        ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row) => (
                    <tr key={row.id}>
                      {visibleColumns.license_plate && (
                        <td>{row.license_plate}</td>
                      )}
                      {visibleColumns.vin && <td>{row.vin}</td>}
                      {visibleColumns.brand && <td>{row.brand}</td>}
                      {visibleColumns.model && <td>{row.model}</td>}
                      {visibleColumns.version && <td>{row.version}</td>}
                      {visibleColumns.year && <td>{row.year}</td>}
                      {visibleColumns.fuel && <td>{row.fuel}</td>}
                      {visibleColumns.power && <td>{row.power} CV</td>}
                      {visibleColumns.displacement && (
                        <td>{row.displacement} cc</td>
                      )}
                      {visibleColumns.color && <td>{row.color}</td>}
                      {visibleColumns.mileage && <td>{row.mileage} km</td>}
                      {visibleColumns.registration_date && (
                        <td>{row.registration_date}</td>
                      )}
                      {visibleColumns.actions && (
                        <td className="text-center">
                          <button
                            className="action-icon-btn action-edit"
                            onClick={() => handleOpenEditModal(row)}
                          >
                            <Pencil size={18} fill="currentColor" />
                          </button>
                          <button
                            className="action-icon-btn action-delete"
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 size={18} />
                          </button>
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
          <div className="text-muted">
            Showing {paginatedData.length} of {filteredData.length} entries
          </div>
          <nav>
            <ul className="pagination pagination-sm m-0">
              <li
                className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </button>
              </li>
              <li className="page-item active">
                <button className="page-link">{currentPage}</button>
              </li>
              <li
                className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {showModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header d-flex justify-content-between align-items-center p-3 border-bottom">
                <h5 className="text-dark m-0">
                  {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
                </h5>
                <button
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <form onSubmit={handleSave} noValidate>
                <div className="modal-body p-4 row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Customer</label>
                    <select
                      className={`form-select ${formErrors.customer_id ? "is-invalid" : ""}`}
                      name="customer_id"
                      value={formState.customer_id}
                      onChange={handleInputChange}
                      disabled={saving}
                    >
                      <option value="">Select customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {`${customer.first_name} ${customer.last_name}`}
                        </option>
                      ))}
                    </select>
                    {formErrors.customer_id && (
                      <div className="invalid-feedback">
                        {formErrors.customer_id}
                      </div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Plate</label>
                    <input
                      type="text"
                      className={`form-control text-uppercase ${formErrors.plate ? "is-invalid" : ""}`}
                      name="plate"
                      placeholder="1234ABC"
                      maxLength={7}
                      value={formState.plate}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.plate && (
                      <div className="invalid-feedback">{formErrors.plate}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">VIN</label>
                    <input
                      type="text"
                      className={`form-control text-uppercase ${formErrors.vin ? "is-invalid" : ""}`}
                      name="vin"
                      maxLength={17}
                      value={formState.vin}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.vin && (
                      <div className="invalid-feedback">{formErrors.vin}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.brand ? "is-invalid" : ""}`}
                      name="brand"
                      value={formState.brand}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.brand && (
                      <div className="invalid-feedback">{formErrors.brand}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Model</label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.model ? "is-invalid" : ""}`}
                      name="model"
                      value={formState.model}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.model && (
                      <div className="invalid-feedback">{formErrors.model}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Version</label>
                    <input
                      type="text"
                      className="form-control"
                      name="version"
                      value={formState.version}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Year</label>
                    <input
                      className={`form-control ${formErrors.year ? "is-invalid" : ""}`}
                      name="year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      value={formState.year}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.year && (
                      <div className="invalid-feedback">{formErrors.year}</div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Fuel</label>
                    <select
                      className={`form-select ${formErrors.fuel_type ? "is-invalid" : ""}`}
                      name="fuel_type"
                      value={formState.fuel_type}
                      onChange={handleInputChange}
                      disabled={saving}
                    >
                      <option value="gasoline">Gasoline</option>
                      <option value="diesel">Diesel</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="plug_in_hybrid">Plug-in hybrid</option>
                      <option value="electric">Electric</option>
                      <option value="lpg">LPG</option>
                    </select>
                    {formErrors.fuel_type && (
                      <div className="invalid-feedback">
                        {formErrors.fuel_type}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Power (HP)</label>
                    <input
                      className={`form-control ${formErrors.power_hp ? "is-invalid" : ""}`}
                      name="power_hp"
                      type="number"
                      min="0"
                      value={formState.power_hp}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.power_hp && (
                      <div className="invalid-feedback">
                        {formErrors.power_hp}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Engine CC</label>
                    <input
                      className={`form-control ${formErrors.engine_cc ? "is-invalid" : ""}`}
                      name="engine_cc"
                      type="number"
                      min="0"
                      value={formState.engine_cc}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.engine_cc && (
                      <div className="invalid-feedback">
                        {formErrors.engine_cc}
                      </div>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Color</label>
                    <input
                      type="text"
                      className="form-control"
                      name="color"
                      value={formState.color}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Mileage</label>
                    <input
                      className={`form-control ${formErrors.mileage ? "is-invalid" : ""}`}
                      name="mileage"
                      type="number"
                      min="0"
                      value={formState.mileage}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.mileage && (
                      <div className="invalid-feedback">
                        {formErrors.mileage}
                      </div>
                    )}
                  </div>

                  <div className="col-md-12 mb-3">
                    <label className="form-label">
                      First Registration Date
                    </label>
                    <input
                      className={`form-control ${formErrors.first_registration_date ? "is-invalid" : ""}`}
                      name="first_registration_date"
                      type="date"
                      value={formState.first_registration_date}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    {formErrors.first_registration_date && (
                      <div className="invalid-feedback">
                        {formErrors.first_registration_date}
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer d-flex bg-light p-3 border-top-0">
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={handleCloseModal}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-changed fw-bold"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingVehicle
                        ? "Save Changes"
                        : "Save Vehicle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}