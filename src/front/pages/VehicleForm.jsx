import { useState } from "react";
import { crearCliente, crearVehiculo } from "../services/api";
import { ClientSelector } from "../components/ClientSelector";

const MATRICULA_REGEX = /^[0-9]{4}[\s-]?[A-Z]{3}$/;

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;

const VALORES_INICIALES = {
    matricula: "",
    vin: "",
    marca: "",
    modelo: "",
    version: "",
    anio: new Date().getFullYear(),
    combustible: "gasolina",
    potencia_cv: "",
    cilindrada_cc: "",
    color: "",
    kilometraje_actual: 0,
    fecha_primera_matriculacion: "",
};

export const VehicleForm = () => {
    const [vehiculo, setVehiculo] = useState(VALORES_INICIALES);
    const [clienteId, setClienteId] = useState(null);
    const [nuevoCliente, setNuevoCliente] = useState({});
    const [errores, setErrores] = useState({});
    const [enviando, setEnviando] = useState(false);
    const [mensaje, setMensaje] = useState(null); // { tipo, texto }

    const handleChange = (campo, valor) => {
        setVehiculo({ ...vehiculo, [campo]: valor });
      
        if (errores[campo]) {
            setErrores({ ...errores, [campo]: undefined });
        }
    };


    const validar = () => {
        const errs = {};

        if (!vehiculo.matricula.trim()) {
            errs.matricula = "Obligatoria";
        } else if (!MATRICULA_REGEX.test(vehiculo.matricula.trim().toUpperCase())) {
            errs.matricula = "Formato inválido (ej: 1234ABC)";
        }

        if (!vehiculo.vin.trim()) {
            errs.vin = "Obligatorio";
        } else if (!VIN_REGEX.test(vehiculo.vin.trim().toUpperCase())) {
            errs.vin = "VIN inválido (17 caracteres, sin I/O/Q)";
        }

        if (!vehiculo.marca.trim()) errs.marca = "Obligatoria";
        if (!vehiculo.modelo.trim()) errs.modelo = "Obligatorio";

        const anio = parseInt(vehiculo.anio);
        const anioActual = new Date().getFullYear();
        if (!anio || anio < 1900 || anio > anioActual + 1) {
            errs.anio = `Entre 1900 y ${anioActual + 1}`;
        }

        const km = parseInt(vehiculo.kilometraje_actual);
        if (isNaN(km) || km < 0) errs.kilometraje_actual = "Número positivo";

        
        const empezoCliente =
            !clienteId &&
            (nuevoCliente.nombre || nuevoCliente.apellidos || nuevoCliente.dni);
        if (empezoCliente) {
            if (!nuevoCliente.nombre?.trim()) errs.cliente = "Falta nombre del cliente";
            else if (!nuevoCliente.apellidos?.trim())
                errs.cliente = "Faltan apellidos del cliente";
            else if (!nuevoCliente.dni?.trim()) errs.cliente = "Falta DNI del cliente";
        }

        return errs;
    };

    const limpiarFormulario = () => {
        setVehiculo(VALORES_INICIALES);
        setClienteId(null);
        setNuevoCliente({});
        setErrores({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje(null);

        const errs = validar();
        if (Object.keys(errs).length > 0) {
            setErrores(errs);
            setMensaje({
                tipo: "danger",
                texto: "Revisa los campos marcados en rojo.",
            });
            return;
        }

        setEnviando(true);
        try {
            let propietarioId = clienteId;

           
            const creandoCliente =
                !clienteId &&
                nuevoCliente.nombre &&
                nuevoCliente.apellidos &&
                nuevoCliente.dni;

            if (creandoCliente) {
                const clienteCreado = await crearCliente({
                    nombre: nuevoCliente.nombre.trim(),
                    apellidos: nuevoCliente.apellidos.trim(),
                    dni: nuevoCliente.dni.trim().toUpperCase(),
                    telefono: nuevoCliente.telefono?.trim() || null,
                    email: nuevoCliente.email?.trim() || null,
                    direccion: nuevoCliente.direccion?.trim() || null,
                });
                propietarioId = clienteCreado.id;
            }

            // 
            const payload = {
                matricula: vehiculo.matricula
                    .trim()
                    .toUpperCase()
                    .replace(/[\s-]/g, ""), 
                vin: vehiculo.vin.trim().toUpperCase(),
                marca: vehiculo.marca.trim(),
                modelo: vehiculo.modelo.trim(),
                version: vehiculo.version.trim() || null,
                anio: parseInt(vehiculo.anio),
                combustible: vehiculo.combustible,
                potencia_cv: vehiculo.potencia_cv
                    ? parseInt(vehiculo.potencia_cv)
                    : null,
                cilindrada_cc: vehiculo.cilindrada_cc
                    ? parseInt(vehiculo.cilindrada_cc)
                    : null,
                color: vehiculo.color.trim() || null,
                kilometraje_actual: parseInt(vehiculo.kilometraje_actual) || 0,
                fecha_primera_matriculacion:
                    vehiculo.fecha_primera_matriculacion || null,
                propietario_inicial_id: propietarioId,
            };

            const vehiculoCreado = await crearVehiculo(payload);

            setMensaje({
                tipo: "success",
                texto: `✅ Vehículo ${vehiculoCreado.matricula} creado correctamente (ID ${vehiculoCreado.id}).`,
            });
            limpiarFormulario();
        } catch (err) {
            setMensaje({ tipo: "danger", texto: `❌ ${err.message}` });
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="container py-4">
            <h1 className="mb-4">Alta de vehículo</h1>

            {mensaje && (
                <div className={`alert alert-${mensaje.tipo} alert-dismissible fade show`}>
                    {mensaje.texto}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setMensaje(null)}
                    />
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
             
                <div className="card mb-3">
                    <div className="card-header">
                        <strong>Datos del vehículo</strong>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label">Matrícula *</label>
                                <input
                                    type="text"
                                    className={`form-control ${errores.matricula ? "is-invalid" : ""}`}
                                    placeholder="1234ABC"
                                    value={vehiculo.matricula}
                                    onChange={(e) =>
                                        handleChange("matricula", e.target.value.toUpperCase())
                                    }
                                />
                                {errores.matricula && (
                                    <div className="invalid-feedback">{errores.matricula}</div>
                                )}
                            </div>

                            <div className="col-md-8">
                                <label className="form-label">VIN (bastidor) *</label>
                                <input
                                    type="text"
                                    className={`form-control ${errores.vin ? "is-invalid" : ""}`}
                                    placeholder="17 caracteres"
                                    maxLength={17}
                                    value={vehiculo.vin}
                                    onChange={(e) =>
                                        handleChange("vin", e.target.value.toUpperCase())
                                    }
                                />
                                {errores.vin && (
                                    <div className="invalid-feedback">{errores.vin}</div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Marca *</label>
                                <input
                                    type="text"
                                    className={`form-control ${errores.marca ? "is-invalid" : ""}`}
                                    placeholder="Ej: Volkswagen"
                                    value={vehiculo.marca}
                                    onChange={(e) => handleChange("marca", e.target.value)}
                                />
                                {errores.marca && (
                                    <div className="invalid-feedback">{errores.marca}</div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Modelo *</label>
                                <input
                                    type="text"
                                    className={`form-control ${errores.modelo ? "is-invalid" : ""}`}
                                    placeholder="Ej: Golf"
                                    value={vehiculo.modelo}
                                    onChange={(e) => handleChange("modelo", e.target.value)}
                                />
                                {errores.modelo && (
                                    <div className="invalid-feedback">{errores.modelo}</div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Versión</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ej: 1.6 TDI Advance"
                                    value={vehiculo.version}
                                    onChange={(e) => handleChange("version", e.target.value)}
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Año *</label>
                                <input
                                    type="number"
                                    className={`form-control ${errores.anio ? "is-invalid" : ""}`}
                                    value={vehiculo.anio}
                                    onChange={(e) => handleChange("anio", e.target.value)}
                                />
                                {errores.anio && (
                                    <div className="invalid-feedback">{errores.anio}</div>
                                )}
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Combustible *</label>
                                <select
                                    className="form-select"
                                    value={vehiculo.combustible}
                                    onChange={(e) => handleChange("combustible", e.target.value)}
                                >
                                    <option value="gasolina">Gasolina</option>
                                    <option value="diesel">Diésel</option>
                                    <option value="hibrido">Híbrido</option>
                                    <option value="hibrido_enchufable">Híbrido enchufable</option>
                                    <option value="electrico">Eléctrico</option>
                                    <option value="glp">GLP</option>
                                    <option value="gnc">GNC</option>
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Potencia (CV)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={vehiculo.potencia_cv}
                                    onChange={(e) =>
                                        handleChange("potencia_cv", e.target.value)
                                    }
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label">Cilindrada (cc)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    value={vehiculo.cilindrada_cc}
                                    onChange={(e) =>
                                        handleChange("cilindrada_cc", e.target.value)
                                    }
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Color</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={vehiculo.color}
                                    onChange={(e) => handleChange("color", e.target.value)}
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Kilometraje *</label>
                                <input
                                    type="number"
                                    min="0"
                                    className={`form-control ${errores.kilometraje_actual ? "is-invalid" : ""}`}
                                    value={vehiculo.kilometraje_actual}
                                    onChange={(e) =>
                                        handleChange("kilometraje_actual", e.target.value)
                                    }
                                />
                                {errores.kilometraje_actual && (
                                    <div className="invalid-feedback">
                                        {errores.kilometraje_actual}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-4">
                                <label className="form-label">Fecha 1ª matriculación</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={vehiculo.fecha_primera_matriculacion}
                                    onChange={(e) =>
                                        handleChange(
                                            "fecha_primera_matriculacion",
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>

               
                <ClientSelector
                    value={clienteId}
                    onChange={setClienteId}
                    nuevoCliente={nuevoCliente}
                    onChangeNuevoCliente={setNuevoCliente}
                    error={errores.cliente}
                />

            
                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={enviando}>
                        {enviando ? "Guardando..." : "Crear vehículo"}
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                            limpiarFormulario();
                            setMensaje(null);
                        }}
                        disabled={enviando}
                    >
                        Limpiar
                    </button>
                </div>
            </form>
        </div>
    );
};