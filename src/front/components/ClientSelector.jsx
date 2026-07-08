import { useState, useEffect } from "react";
import { listarClientes } from "../services/api";

export const ClientSelector = ({
    value,                 
    onChange,              
    nuevoCliente,          
    onChangeNuevoCliente,  
    error                  
}) => {
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [errorCarga, setErrorCarga] = useState(null);
    const [modo, setModo] = useState("existente"); 

   
    useEffect(() => {
        setCargando(true);
        listarClientes()
            .then((data) => setClientes(data))
            .catch((err) => setErrorCarga(err.message))
            .finally(() => setCargando(false));
    }, []);

    const cambiarModo = (nuevoModo) => {
        setModo(nuevoModo);
       
        if (nuevoModo === "existente") {
            onChangeNuevoCliente({});
        } else if (nuevoModo === "nuevo") {
            onChange(null);
        } else {
            onChange(null);
            onChangeNuevoCliente({});
        }
    };

    const handleNuevoChange = (campo, valor) => {
        onChangeNuevoCliente({ ...nuevoCliente, [campo]: valor });
    };

    return (
        <div className="card mb-3">
            <div className="card-header">
                <strong>Propietario del vehículo</strong>
            </div>
            <div className="card-body">
              
                <div className="btn-group mb-3 flex-wrap" role="group">
                    <input
                        type="radio"
                        className="btn-check"
                        name="modoCliente"
                        id="modoExistente"
                        checked={modo === "existente"}
                        onChange={() => cambiarModo("existente")}
                    />
                    <label className="btn btn-outline-primary" htmlFor="modoExistente">
                        Cliente existente
                    </label>

                    <input
                        type="radio"
                        className="btn-check"
                        name="modoCliente"
                        id="modoNuevo"
                        checked={modo === "nuevo"}
                        onChange={() => cambiarModo("nuevo")}
                    />
                    <label className="btn btn-outline-primary" htmlFor="modoNuevo">
                        Crear cliente nuevo
                    </label>

                    <input
                        type="radio"
                        className="btn-check"
                        name="modoCliente"
                        id="modoSin"
                        checked={modo === "sin"}
                        onChange={() => cambiarModo("sin")}
                    />
                    
                </div>

                
                {modo === "existente" && (
                    <>
                        {cargando && <p className="text-muted mb-0">Cargando clientes...</p>}
                        {errorCarga && (
                            <p className="text-danger mb-0">Error al cargar: {errorCarga}</p>
                        )}
                        {!cargando && !errorCarga && (
                            <select
                                className={`form-select ${error ? "is-invalid" : ""}`}
                                value={value || ""}
                                onChange={(e) =>
                                    onChange(e.target.value ? parseInt(e.target.value) : null)
                                }
                            >
                                <option value="">-- Selecciona un cliente --</option>
                                {clientes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre} {c.apellidos} ({c.dni})
                                    </option>
                                ))}
                            </select>
                        )}
                        {error && (
                            <div className="invalid-feedback d-block">{error}</div>
                        )}
                    </>
                )}

                
                {modo === "nuevo" && (
                    <div className="row g-2">
                        <div className="col-md-6">
                            <label className="form-label">Nombre *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nuevoCliente.nombre || ""}
                                onChange={(e) => handleNuevoChange("nombre", e.target.value)}
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Apellidos *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nuevoCliente.apellidos || ""}
                                onChange={(e) =>
                                    handleNuevoChange("apellidos", e.target.value)
                                }
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">DNI *</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nuevoCliente.dni || ""}
                                onChange={(e) =>
                                    handleNuevoChange("dni", e.target.value.toUpperCase())
                                }
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Teléfono</label>
                            <input
                                type="tel"
                                className="form-control"
                                value={nuevoCliente.telefono || ""}
                                onChange={(e) =>
                                    handleNuevoChange("telefono", e.target.value)
                                }
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={nuevoCliente.email || ""}
                                onChange={(e) => handleNuevoChange("email", e.target.value)}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Dirección</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nuevoCliente.direccion || ""}
                                onChange={(e) =>
                                    handleNuevoChange("direccion", e.target.value)
                                }
                            />
                        </div>
                        {error && (
                            <div className="col-12">
                                <div className="alert alert-danger mt-2 mb-0">{error}</div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );

};