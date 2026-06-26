import {
    Users, Search, Plus, Copy, FileSpreadsheet,
    FileText, TableProperties, Eye, FilterX, ArrowUpDown, Trash2
} from 'lucide-react';
import { useState, useMemo } from 'react';
import './CustomerList.css';
import { Menu } from 'lucide-react';
import * as XLSX from 'xlsx';

const INITIAL_DATA = [
    { id: 1, name: 'John Doe', service: 'Brake Replacement', plate: '192-ABC-30', status: 'Pending Parts', car: 'Toyota Corolla 2018', mechanic: 'Tech-Robert', phone: '+1 555-0192' },
    { id: 2, name: 'Jane Smith', service: 'Oil Change', plate: '192-XYZ-04', status: 'Completed', car: 'Honda Civic 2020', mechanic: 'Tech-Alice', phone: '+1 555-0204' },
    { id: 3, name: 'Mike Ross', service: 'Engine Tuning', plate: '743-MNO-12', status: 'In Progress', car: 'Ford Mustang 2015', mechanic: 'Tech-Robert', phone: '+1 555-0743' },
];

const INITIAL_FILTERS = {
    name: '', service: '', plate: '', status: '', car: '', mechanic: '', phone: ''
};

const INITIAL_VISIBILITY = {
    name: true, service: true, plate: true, status: true, car: true, mechanic: true, phone: true
};

export default function CustomerList() {
    const [data, setData] = useState(INITIAL_DATA);
    const [globalSearch, setGlobalSearch] = useState('');
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const [columnFilters, setColumnFilters] = useState(INITIAL_FILTERS);
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBILITY);
    const [selectedRows, setSelectedRows] = useState({});

    const [showAddModal, setShowAddModal] = useState(false);
    const initialFormState = {
        name: '',
        service: '',
        plate: '',
        status: 'Pending Parts',
        car: '',
        mechanic: '',
        phone: ''
    };
    const [newCustomer, setNewCustomer] = useState(initialFormState);


    const handleColumnFilterChange = (column, value) => {
        setColumnFilters(prev => ({ ...prev, [column]: value }));
        setCurrentPage(1);
    };

    const handleToggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const handleClearFilters = () => {
        setGlobalSearch('');
        setColumnFilters(INITIAL_FILTERS);
        setCurrentPage(1);
    };

    const handleRedirectToSettings = () => {
        alert('Redirecting to column configuration section...');
    };

    const handleCopy = () => {
        const visibleKeys = Object.keys(visibleColumns).filter(k => visibleColumns[k]);
        const textToCopy = paginatedData.map(row =>
            visibleKeys.map(k => row[k]).join('\t')
        ).join('\n');

        navigator.clipboard.writeText(textToCopy);
        alert('Copied visible records to clipboard!');
    };

    const handleExportExcel = () => {
        const visibleKeys = Object.keys(visibleColumns).filter(k => visibleColumns[k]);
        const exportRows = paginatedData.map(row => {
            const filteredRow = {};
            visibleKeys.forEach(k => {
                filteredRow[k] = row[k];
            });
            return filteredRow;
        });
        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
        XLSX.writeFile(workbook, "customer_list.xlsx");
    };

    const handleExportCSV = () => {
        const visibleKeys = Object.keys(visibleColumns).filter(k => visibleColumns[k]);
        const headers = visibleKeys.join(',');
        const rows = paginatedData.map(row =>
            visibleKeys.map(k => `"${row[k]}"`).join(',')
        ).join('\n');

        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "customer_list.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allSelected = {};
            paginatedData.forEach(row => { allSelected[row.id] = true; });
            setSelectedRows(allSelected);
        } else {
            setSelectedRows({});
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDeleteSelected = () => {
        const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);

        if (selectedIds.length === 0) {
            alert('Please select at least one customer to remove.');
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the ${selectedIds.length} selected customers?`
        );

        if (confirmDelete) {
            setData(prevData => prevData.filter(row => !selectedIds.includes(String(row.id))));
            setSelectedRows({});
        }
    };


    const filteredData = useMemo(() => {
        return data.filter(row => {
            const matchesGlobal = Object.keys(row).some(key =>
                String(row[key]).toLowerCase().includes(globalSearch.toLowerCase())
            );
            const matchesColumns = Object.keys(columnFilters).every(key =>
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

    const totalPages = recordsPerPage === -1 ? 1 : Math.ceil(filteredData.length / recordsPerPage);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveCustomer = (e) => {
        e.preventDefault();

        if (!newCustomer.name.trim()) {
            alert("Please, enter at least the name of the customer.");
            return;
        }

        const freshCustomer = {
            id: Date.now(),
            ...newCustomer
        };

        setData(prevData => [freshCustomer, ...prevData]);
        setNewCustomer(initialFormState);
        setShowAddModal(false);
    };

    return (
        <><header className="bg-orange-600 text-white d-flex align-items-center px-4 shadow-sm" style={{ height: '56px', backgroundColor: '#e65100' }}>
            <button
                className="btn text-white p-2 border-0 d-flex align-items-center"
                onClick={() => console.log('Open sidebar menu')}
                aria-label="Open menu"
            >
                <Menu size={24} />
            </button>
        </header><div className="container-fluid mt-4 px-4 app-customer-container">

                <div className="d-flex align-items-center mb-4">
                    <Users className="me-2 text-secondary" size={32} />
                    <h2 className="header-title m-0">Customer List</h2>
                </div>

                <div className="row mb-3 g-2">
                    <div className="col-md-10">
                        <div className="input-group">
                            <span className="input-group-text bg-white"><Search size={18} className="text-muted" /></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Filter Customers by Any Field (e.g., Zone)"
                                value={globalSearch}
                                onChange={(e) => { setGlobalSearch(e.target.value); setCurrentPage(1); }} />
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
                        <button onClick={handleCopy} className="btn btn-orange-action btn-sm d-flex align-items-center gap-1">
                            <Copy size={14} /> Copy
                        </button>
                        <button onClick={handleExportExcel} className="btn btn-orange-action btn-sm d-flex align-items-center gap-1">
                            <FileSpreadsheet size={14} /> Excel
                        </button>
                        <button onClick={handleExportCSV} className="btn btn-orange-action btn-sm d-flex align-items-center gap-1">
                            <FileText size={14} /> CSV
                        </button>

                        <button
                            onClick={handleDeleteSelected}
                            className="btn btn-orange-action btn-sm d-flex align-items-center"
                            title="Delete Selected Customers"
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
                                    {Object.keys(visibleColumns).map(col => (
                                        <label key={col} className="dropdown-item d-flex align-items-center gap-2 style-cursor">
                                            <input
                                                type="checkbox"
                                                className="form-check-input m-0"
                                                checked={visibleColumns[col]}
                                                onChange={() => handleToggleColumn(col)} />
                                            <span className="text-capitalize">{col.replace(/([A-Z])/g, ' $1')}</span>
                                        </label>
                                    ))}
                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleClearFilters} className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger">
                                        <FilterX size={14} /> Clear Filters
                                    </button>
                                    <button onClick={handleRedirectToSettings} className="dropdown-item d-flex align-items-center gap-2 py-2">
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
                            onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
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
                                    <th style={{ width: '40px' }}>
                                        <input type="checkbox" onChange={handleSelectAll} checked={Object.keys(selectedRows).length === paginatedData.length && paginatedData.length > 0} />
                                    </th>
                                    {visibleColumns.name && <th>Name</th>}
                                    {visibleColumns.service && <th>Service/Repair</th>}
                                    {visibleColumns.plate && <th>License Plate</th>}
                                    {visibleColumns.status && <th>Status</th>}
                                    {visibleColumns.car && <th>Car Brand/Model</th>}
                                    {visibleColumns.mechanic && <th>Mechanic</th>}
                                    {visibleColumns.phone && <th>Phone</th>}
                                </tr>

                                <tr>
                                    <td></td>
                                    {visibleColumns.name && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search Name"
                                                value={columnFilters.name}
                                                onChange={(e) => handleColumnFilterChange('name', e.target.value)} />
                                        </td>
                                    )}
                                    {visibleColumns.service && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search Service"
                                                value={columnFilters.service}
                                                onChange={(e) => handleColumnFilterChange('service', e.target.value)} />
                                        </td>
                                    )}
                                    {visibleColumns.plate && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search Plate"
                                                value={columnFilters.plate}
                                                onChange={(e) => handleColumnFilterChange('plate', e.target.value)} />
                                        </td>
                                    )}
                                    {visibleColumns.status && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search Status"
                                                value={columnFilters.status}
                                                onChange={(e) => handleColumnFilterChange('status', e.target.value)} />
                                        </td>
                                    )}
                                    {visibleColumns.car && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search Car"
                                                value={columnFilters.car}
                                                onChange={(e) => handleColumnFilterChange('car', e.target.value)} />
                                        </td>
                                    )}
                                    {visibleColumns.mechanic && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search Mechanic"
                                                value={columnFilters.mechanic}
                                                onChange={(e) => handleColumnFilterChange('mechanic', e.target.value)} />
                                        </td>
                                    )}
                                    {visibleColumns.phone && (
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Search Phone"
                                                value={columnFilters.phone}
                                                onChange={(e) => handleColumnFilterChange('phone', e.target.value)} />
                                        </td>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length > 0 ? (
                                    paginatedData.map(row => (
                                        <tr key={row.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    checked={!!selectedRows[row.id]}
                                                    onChange={() => handleSelectRow(row.id)} />
                                            </td>
                                            {visibleColumns.name && <td>{row.name}</td>}
                                            {visibleColumns.service && <td>{row.service}</td>}
                                            {visibleColumns.plate && <td>{row.plate}</td>}
                                            {visibleColumns.status && (
                                                <td>
                                                    <span className={`badge ${row.status === 'Completed' ? 'badge-active' : row.status === 'In Progress' ? 'badge-progress' : 'badge-suspended'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.car && <td>{row.car}</td>}
                                            {visibleColumns.mechanic && <td>{row.mechanic}</td>}
                                            {visibleColumns.phone && <td>{row.phone}</td>}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={Object.values(visibleColumns).filter(v => v).length + 1} className="text-center">
                                            No records found matching your filters.
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
                            {filteredData.length === 0 ? (
                                "Showing 0 of 0 entries"
                            ) : (
                                `Showing ${((currentPage - 1) * recordsPerPage) + 1} of ${Math.min(currentPage * recordsPerPage, filteredData.length)} entries`
                            )}
                        </div>
                        <nav>
                            <ul className="pagination mb-0">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                                        Previous
                                    </button>
                                </li>
                                {[...Array(totalPages)].map((_, i) => (
                                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}

                {showAddModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} role="dialog">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header bg-orange text-white" style={{ backgroundColor: '#e65100' }}>
                                    <h5 className="modal-title m-0 fw-bold text-white">Add New Customer</h5>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setShowAddModal(false)}
                                        aria-label="Close"
                                    ></button>
                                </div>
                                <form onSubmit={handleSaveCustomer}>
                                    <div className="modal-body p-4">
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Customer Name</label>
                                            <input type="text" name="name" className="form-control" value={newCustomer.name} onChange={handleInputChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Service / Repair</label>
                                            <input type="text" name="service" className="form-control" value={newCustomer.service} onChange={handleInputChange} />
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">License Plate</label>
                                                <input type="text" name="plate" className="form-control" value={newCustomer.plate} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Status</label>
                                                <select name="status" className="form-select" value={newCustomer.status} onChange={handleInputChange}>
                                                    <option value="Pending Parts">Pending Parts</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label fw-semibold">Car Brand / Model</label>
                                            <input type="text" name="car" className="form-control" value={newCustomer.car} onChange={handleInputChange} />
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Mechanic</label>
                                                <input type="text" name="mechanic" className="form-control" value={newCustomer.mechanic} onChange={handleInputChange} />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Phone Number</label>
                                                <input type="text" name="phone" className="form-control" value={newCustomer.phone} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn btn-orange text-white" style={{ backgroundColor: '#e65100' }}>
                                            Save Customer
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div></>
    );
}