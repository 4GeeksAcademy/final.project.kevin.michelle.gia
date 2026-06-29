import { useEffect, useMemo, useState } from "react";
import { Users, Search, Plus, Copy, FileSpreadsheet, FileText, TableProperties, Eye, FilterX, ArrowUpDown, Trash2, Menu } from "lucide-react";
import * as XLSX from "xlsx";
import "./CustomerList.css";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001";

const INITIAL_FILTERS = {
    full_name: "",
    dni: "",
    driving_license: "",
    phone: "",
    vehicles_summary: "",
    email: "",
    address: ""
};

const INITIAL_VISIBILITY = {
    full_name: true,
    dni: true,
    driving_license: true,
    phone: true,
    vehicles_summary: true,
    email: true,
    address: true
};

const initialFormState = {
    first_name: "",
    last_name: "",
    dni: "",
    driving_license: "",
    phone: "",
    email: "",
    address: ""
};

const getToken = () => localStorage.getItem("token");

const formatVehicle = (vehicle) => {
    const plate = vehicle.plate || "No plate";
    const brandModel = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");

    return brandModel ? `${plate} - ${brandModel}` : plate;
};

const normalizeCustomer = (customer) => {
    const vehicles = customer.vehicles || [];

    return {
        id: customer.id,
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        full_name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        dni: customer.dni || "",
        driving_license: customer.driving_license || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        vehicles,
        vehicles_count: customer.vehicles_count ?? vehicles.length,
        vehicles_summary: vehicles.length > 0
            ? vehicles.map(formatVehicle).join(" | ")
            : "No vehicles"
    };
};

export default function CustomerList() {
    const [data, setData] = useState([]);
    const [globalSearch, setGlobalSearch] = useState("");
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const [columnFilters, setColumnFilters] = useState(INITIAL_FILTERS);
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBILITY);
    const [selectedRows, setSelectedRows] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState(initialFormState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchCustomers = async () => {
        setLoading(true);
        setError("");

        try {
            const token = getToken();

            const response = await fetch(`${API_URL}/api/customers`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || result.msg || "Error loading customers");
            }

            const normalizedCustomers = result.customers.map(normalizeCustomer);
            setData(normalizedCustomers);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

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

    const handleRedirectToSettings = () => {
        alert("Column reordering can be implemented later.");
    };

    const filteredData = useMemo(() => {
        return data.filter((row) => {
            const matchesGlobal = Object.keys(row).some((key) =>
                String(row[key]).toLowerCase().includes(globalSearch.toLowerCase())
            );

            const matchesColumns = Object.keys(columnFilters).every((key) =>
                String(row[key]).toLowerCase().includes(columnFilters[key].toLowerCase())
            );

            return matchesGlobal && matchesColumns;
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

    const handleCopy = () => {
        const visibleKeys = Object.keys(visibleColumns).filter((key) => visibleColumns[key]);

        const textToCopy = paginatedData
            .map((row) => visibleKeys.map((key) => row[key]).join("\t"))
            .join("\n");

        navigator.clipboard.writeText(textToCopy);
        alert("Copied visible records to clipboard.");
    };

    const handleExportExcel = () => {
        const visibleKeys = Object.keys(visibleColumns).filter((key) => visibleColumns[key]);

        const exportRows = paginatedData.map((row) => {
            const filteredRow = {};

            visibleKeys.forEach((key) => {
                filteredRow[key] = row[key];
            });

            return filteredRow;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
        XLSX.writeFile(workbook, "customer_list.xlsx");
    };

    const handleExportCSV = () => {
        const visibleKeys = Object.keys(visibleColumns).filter((key) => visibleColumns[key]);
        const headers = visibleKeys.join(",");

        const rows = paginatedData
            .map((row) =>
                visibleKeys
                    .map((key) => `"${String(row[key] || "").replaceAll('"', '""')}"`)
                    .join(",")
            )
            .join("\n");

        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");

        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "customer_list.csv");

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSelectAll = (event) => {
    if (event.target.checked) {
        const allSelected = { ...selectedRows }; 
        paginatedData.forEach((row) => {
            allSelected[row.id] = true;
        });
        setSelectedRows(allSelected);
    } else {
        const newSelected = { ...selectedRows };
        paginatedData.forEach((row) => {
            delete newSelected[row.id];
        });
        setSelectedRows(newSelected);
    }
};

    const handleSelectRow = (id) => {
        setSelectedRows((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setNewCustomer((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCloseModal = () => {
    setShowAddModal(false);
    setNewCustomer(initialFormState);
};

    const handleSaveCustomer = async (event) => {
        event.preventDefault();

        if (
            !newCustomer.first_name.trim() ||
            !newCustomer.last_name.trim() ||
            !newCustomer.dni.trim() ||
            !newCustomer.driving_license.trim() ||
            !newCustomer.phone.trim()
        ) {
            alert("Please fill first name, last name, DNI, driving license and phone.");
            return;
        }

        try {
            const token = getToken();

            const response = await fetch(`${API_URL}/api/customers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newCustomer)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || result.msg || "Error creating customer");
            }

            setData((prevData) => [normalizeCustomer(result.customer), ...prevData]);
            setNewCustomer(initialFormState);
            setShowAddModal(false);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDeleteSelected = async () => {
        const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);

        if (selectedIds.length === 0) {
            alert("Please select at least one customer to remove.");
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to deactivate ${selectedIds.length} selected customer(s)?`
        );

        if (!confirmDelete) return;

        try {
            const token = getToken();

            const responses = await Promise.all(
                selectedIds.map((id) =>
                    fetch(`${API_URL}/api/customers/${id}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                )
            );

            const hasError = responses.some((response) => !response.ok);

            if (hasError) {
                throw new Error("Some customers could not be deactivated.");
            }

            setData((prevData) =>
                prevData.filter((row) => !selectedIds.includes(String(row.id)))
            );

            setSelectedRows({});
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <>
            <header
                className="bg-orange-600 text-white d-flex align-items-center px-4 shadow-sm"
                style={{ height: "56px", backgroundColor: "#e65100" }}
            >
                <button
                    className="btn text-white p-2 border-0 d-flex align-items-center"
                    onClick={() => console.log("Open sidebar menu")}
                    aria-label="Open menu"
                >
                    <Menu size={24} />
                </button>
            </header>

            <div className="container-fluid mt-4 px-4 app-customer-container">
                <div className="d-flex align-items-center mb-4">
                    <Users className="me-2 text-secondary" size={32} />
                    <h2 className="header-title m-0">Customer List</h2>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <div className="row mb-3 g-2">
                    <div className="col-md-10">
                        <div className="input-group">
                            <span className="input-group-text bg-white">
                                <Search size={18} className="text-muted" />
                            </span>

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filter customers by any field"
                                value={globalSearch}
                                onChange={(event) => {
                                    setGlobalSearch(event.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="col-md-2">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-orange w-100 d-flex align-items-center justify-content-center gap-1"
                        >
                            <Plus size={18} /> Add Customer
                        </button>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <div className="d-flex gap-1 flex-wrap">
                        <button
                            onClick={handleCopy}
                            className="btn btn-orange-action btn-sm d-flex align-items-center gap-1"
                        >
                            <Copy size={14} /> Copy
                        </button>

                        <button
                            onClick={handleExportExcel}
                            className="btn btn-orange-action btn-sm d-flex align-items-center gap-1"
                        >
                            <FileSpreadsheet size={14} /> Excel
                        </button>

                        <button
                            onClick={handleExportCSV}
                            className="btn btn-orange-action btn-sm d-flex align-items-center gap-1"
                        >
                            <FileText size={14} /> CSV
                        </button>

                        <button
                            onClick={handleDeleteSelected}
                            className="btn btn-orange-action btn-sm d-flex align-items-center"
                            title="Deactivate selected customers"
                        >
                            <Trash2 size={14} />
                        </button>

                        <div className="position-relative">
                            <button
                                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                                className="btn btn-orange-action btn-sm d-flex align-items-center gap-1"
                            >
                                <TableProperties size={14} /> Table Options
                            </button>

                            {showOptionsDropdown && (
                                <div className="dropdown-menu show shadow p-2 position-absolute start-0 mt-1 backend-dropdown">
                                    <div className="dropdown-header px-2 py-1 fw-bold text-dark d-flex align-items-center gap-1">
                                        <Eye size={14} /> Show / Hide Columns
                                    </div>

                                    {Object.keys(visibleColumns).map((column) => (
                                        <label
                                            key={column}
                                            className="dropdown-item d-flex align-items-center gap-2 style-cursor"
                                        >
                                            <input
                                                type="checkbox"
                                                className="form-check-input m-0"
                                                checked={visibleColumns[column]}
                                                onChange={() => handleToggleColumn(column)}
                                            />

                                            <span className="text-capitalize">
                                                {column.replaceAll("_", " ")}
                                            </span>
                                        </label>
                                    ))}

                                    <div className="dropdown-divider"></div>

                                    <button
                                        onClick={handleClearFilters}
                                        className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger"
                                    >
                                        <FilterX size={14} /> Clear Filters
                                    </button>

                                    <button
                                        onClick={handleRedirectToSettings}
                                        className="dropdown-item d-flex align-items-center gap-2 py-2"
                                    >
                                        <ArrowUpDown size={14} /> Reorder Columns
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 text-muted-custom">
                        <span>Show</span>

                        <select
                            className="form-select form-select-sm"
                            value={recordsPerPage}
                            onChange={(event) => {
                                setRecordsPerPage(Number(event.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10 records</option>
                            <option value={100}>100 records</option>
                            <option value={500}>500 records</option>
                            <option value={-1}>All records</option>
                        </select>
                    </div>
                </div>

                <div className="card shadow-sm table-card-wrapper">
                    <div className="card-body p-3 overflow-auto">
                        <table className="table table-striped table-bordered align-middle m-0 customer-workshop-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "40px" }}>
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={
                                                Object.keys(selectedRows).length === paginatedData.length &&
                                                paginatedData.length > 0
                                            }
                                        />
                                    </th>

                                    {visibleColumns.full_name && <th>Name</th>}
                                    {visibleColumns.dni && <th>DNI</th>}
                                    {visibleColumns.driving_license && <th>Driving License</th>}
                                    {visibleColumns.phone && <th>Phone</th>}
                                    {visibleColumns.vehicles_summary && <th>Vehicles</th>}
                                    {visibleColumns.email && <th>Email</th>}
                                    {visibleColumns.address && <th>Address</th>}
                                </tr>

                                <tr>
                                    <td></td>

                                    {visibleColumns.full_name && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search name"
                                                value={columnFilters.full_name}
                                                onChange={(event) =>
                                                    handleColumnFilterChange("full_name", event.target.value)
                                                }
                                            />
                                        </td>
                                    )}

                                    {visibleColumns.dni && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search DNI"
                                                value={columnFilters.dni}
                                                onChange={(event) =>
                                                    handleColumnFilterChange("dni", event.target.value)
                                                }
                                            />
                                        </td>
                                    )}

                                    {visibleColumns.driving_license && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search license"
                                                value={columnFilters.driving_license}
                                                onChange={(event) =>
                                                    handleColumnFilterChange("driving_license", event.target.value)
                                                }
                                            />
                                        </td>
                                    )}

                                    {visibleColumns.phone && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search phone"
                                                value={columnFilters.phone}
                                                onChange={(event) =>
                                                    handleColumnFilterChange("phone", event.target.value)
                                                }
                                            />
                                        </td>
                                    )}

                                    {visibleColumns.vehicles_summary && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search vehicle"
                                                value={columnFilters.vehicles_summary}
                                                onChange={(event) =>
                                                    handleColumnFilterChange("vehicles_summary", event.target.value)
                                                }
                                            />
                                        </td>
                                    )}

                                    {visibleColumns.email && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search email"
                                                value={columnFilters.email}
                                                onChange={(event) =>
                                                    handleColumnFilterChange("email", event.target.value)
                                                }
                                            />
                                        </td>
                                    )}

                                    {visibleColumns.address && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search address"
                                                value={columnFilters.address}
                                                onChange={(event) =>
                                                    handleColumnFilterChange("address", event.target.value)
                                                }
                                            />
                                        </td>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={Object.values(visibleColumns).filter(Boolean).length + 1}
                                            className="text-center"
                                        >
                                            Loading customers...
                                        </td>
                                    </tr>
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={!!selectedRows[row.id]}
                                                    onChange={() => handleSelectRow(row.id)}
                                                />
                                            </td>

                                            {visibleColumns.full_name && <td>{row.full_name}</td>}
                                            {visibleColumns.dni && <td>{row.dni}</td>}
                                            {visibleColumns.driving_license && <td>{row.driving_license}</td>}
                                            {visibleColumns.phone && <td>{row.phone}</td>}

                                            {visibleColumns.vehicles_summary && (
                                                <td>
                                                    {row.vehicles.length > 0 ? (
                                                        <div className="d-flex flex-column gap-1">
                                                            {row.vehicles.map((vehicle) => (
                                                                <span key={vehicle.id} className="badge text-bg-light border">
                                                                    {vehicle.plate} · {vehicle.brand} {vehicle.model}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">No vehicles</span>
                                                    )}
                                                </td>
                                            )}

                                            {visibleColumns.email && <td>{row.email || "-"}</td>}
                                            {visibleColumns.address && <td>{row.address || "-"}</td>}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={Object.values(visibleColumns).filter(Boolean).length + 1}
                                            className="text-center"
                                        >
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {recordsPerPage !== -1 && (
                    <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="text-muted-custom">
                            {filteredData.length === 0
                                ? "Showing 0 of 0 entries"
                                : `Showing ${(currentPage - 1) * recordsPerPage + 1} of ${Math.min(
                                      currentPage * recordsPerPage,
                                      filteredData.length
                                  )} entries`}
                        </div>

                        <nav>
                            <ul className="pagination mb-0">
                                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                </li>

                                {[...Array(totalPages)].map((_, index) => (
                                    <li
                                        key={index}
                                        className={`page-item ${currentPage === index + 1 ? "active" : ""}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}

                                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                                    <button
                                        className="page-link"
                                        onClick={() =>
                                            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                        }
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}

                {showAddModal && (
                    <div
                        className="modal show d-block"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                        role="dialog"
                    >
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow">
                                <div
                                    className="modal-header bg-orange text-white"
                                    style={{ backgroundColor: "#e65100" }}
                                >
                                    <h5 className="modal-title m-0 fw-bold text-white">
                                        Add New Customer
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={handleCloseModal}
                                        aria-label="Close"
                                    ></button>
                                </div>

                                <form onSubmit={handleSaveCustomer}>
                                    <div className="modal-body p-4">
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">First Name</label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    className="form-control"
                                                    value={newCustomer.first_name}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Last Name</label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    className="form-control"
                                                    value={newCustomer.last_name}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">DNI</label>
                                                <input
                                                    type="text"
                                                    name="dni"
                                                    className="form-control"
                                                    value={newCustomer.dni}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>

                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">
                                                    Driving License
                                                </label>
                                                <input
                                                    type="text"
                                                    name="driving_license"
                                                    className="form-control"
                                                    value={newCustomer.driving_license}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Phone</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                className="form-control"
                                                value={newCustomer.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                value={newCustomer.email}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Address</label>
                                            <input
                                                type="text"
                                                name="address"
                                                className="form-control"
                                                value={newCustomer.address}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="modal-footer bg-light">
                                        <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCloseModal}
                                    >
                                        Cancel
                                    </button>

                                        <button
                                            type="submit"
                                            className="btn btn-orange text-white"
                                            style={{ backgroundColor: "#e65100" }}
                                        >
                                            Save Customer
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