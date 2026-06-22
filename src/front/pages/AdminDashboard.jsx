import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const emptyMechanicForm = {
  first_name: "",
  last_name: "",
  dni: "",
  phone: "",
  email: "",
  password: "",
  password_confirm: ""
};

const workshopColumns = [
  {
    title: "En reparación",
    description: "Vehículos que ya están siendo revisados por el equipo."
  },
  {
    title: "Esperando repuestos",
    description: "Coches detenidos hasta recibir piezas o materiales."
  },
  {
    title: "Presupuesto pendiente",
    description: "Vehículos esperando que el cliente acepte el presupuesto."
  },
  {
    title: "Listos para entregar",
    description: "Trabajos terminados y preparados para avisar al cliente."
  }
];

const getStoredObject = (key) => {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Error leyendo ${key} desde localStorage`, error);
    localStorage.removeItem(key);
    return null;
  }
};

export const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const currentUser = user || getStoredObject("user");

  const [mechanicForm, setMechanicForm] = useState(emptyMechanicForm);
  const [mechanics, setMechanics] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getMechanics = async () => {
    setIsLoadingList(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/mechanics`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudieron cargar los mecánicos.");
        return;
      }

      setMechanics(data.mechanics || []);
    } catch (error) {
      setError("No se pudo conectar con el servidor.");
      console.error(error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getMechanics();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("employee");

    navigate("/login");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setMechanicForm({
      ...mechanicForm,
      [name]: value
    });

    setError("");
    setSuccessMessage("");
  };

  const handleCreateMechanic = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    if (mechanicForm.password !== mechanicForm.password_confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/mechanics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(mechanicForm)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No se pudo crear el mecánico.");
        return;
      }

      if (data.employee) {
        setMechanics((prevMechanics) => [data.employee, ...prevMechanics]);
      } else {
        getMechanics();
      }

      setMechanicForm(emptyMechanicForm);

      setSuccessMessage(
        "Mecánico creado correctamente. Ya puede entrar desde el login con su email y contraseña."
      );
    } catch (error) {
      setError("No se pudo conectar con el servidor.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <main className="container">
        <header className="bg-white border rounded-4 shadow-sm p-4 mb-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3">
            <div>
              <p className="text-uppercase text-danger small fw-bold mb-2">
                Panel del taller
              </p>

              <h1 className="fw-bold text-dark mb-2">
                Vista general del taller
              </h1>

              <p className="text-muted mb-3">
                Controla el estado de los vehículos, los presupuestos pendientes y el equipo de mecánicos.
              </p>

              <div className="d-flex flex-column flex-md-row gap-2">
                <span className="badge text-bg-dark rounded-pill px-3 py-2">
                  {currentUser?.role || "admin"}
                </span>

                <span className="badge text-bg-light border text-dark rounded-pill px-3 py-2">
                  {currentUser?.email || "Administrador"}
                </span>
              </div>
            </div>

            <button
              className="btn btn-outline-secondary btn-sm px-3"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
              <p className="text-muted small mb-1">Vehículos activos</p>
              <h2 className="fw-bold mb-0">0</h2>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
              <p className="text-muted small mb-1">Mecánicos registrados</p>
              <h2 className="fw-bold mb-0">{mechanics.length}</h2>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
              <p className="text-muted small mb-1">Presupuestos pendientes</p>
              <h2 className="fw-bold mb-0">0</h2>
            </div>
          </div>
        </section>

        {error && (
          <div className="alert alert-danger rounded-4" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success rounded-4" role="alert">
            {successMessage}
          </div>
        )}

        <section className="bg-white border rounded-4 shadow-sm p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
            <div>
              <p className="text-uppercase text-muted small fw-semibold mb-2">
                Flujo de trabajo
              </p>

              <h2 className="h4 fw-bold mb-1">
                Estado de los vehículos
              </h2>

              <p className="text-muted mb-0">
                Aquí irá el tablero principal de la app, parecido a columnas tipo GitHub Projects.
              </p>
            </div>

            <button
              type="button"
              className={`btn px-4 py-2 fw-bold align-self-start ${styles.btnLogin}`}
            >
              Nuevo vehículo
            </button>
          </div>

          <div className="row g-3">
            {workshopColumns.map((column) => (
              <div className="col-12 col-md-6 col-xl-3" key={column.title}>
                <div className="border rounded-4 bg-light p-3 h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <h3 className="h6 fw-bold mb-0">
                      {column.title}
                    </h3>

                    <span className="badge text-bg-white border text-dark rounded-pill">
                      0
                    </span>
                  </div>

                  <p className="text-muted small mb-3">
                    {column.description}
                  </p>

                  <div className="bg-white border rounded-4 p-3 text-center">
                    <p className="text-muted small mb-0">
                      Todavía no hay coches en esta columna.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="row g-4 align-items-start">
          <div className="col-12 col-lg-5">
            <div className="bg-white border rounded-4 shadow-sm p-4">
              <p className="text-uppercase text-muted small fw-semibold mb-2">
                Equipo
              </p>

              <h2 className="h4 fw-bold mb-2">
                Dar de alta mecánico
              </h2>

              <p className="text-muted mb-4">
                Crea una cuenta para que el mecánico pueda iniciar sesión y ver sus trabajos asignados.
              </p>

              <form onSubmit={handleCreateMechanic}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold" htmlFor="first_name">
                      Nombre
                    </label>

                    <input
                      id="first_name"
                      type="text"
                      name="first_name"
                      className="form-control py-2 px-3"
                      value={mechanicForm.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold" htmlFor="last_name">
                      Apellido
                    </label>

                    <input
                      id="last_name"
                      type="text"
                      name="last_name"
                      className="form-control py-2 px-3"
                      value={mechanicForm.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="dni">
                      DNI / NIE
                    </label>

                    <input
                      id="dni"
                      type="text"
                      name="dni"
                      className="form-control py-2 px-3"
                      value={mechanicForm.dni}
                      onChange={handleInputChange}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="phone">
                      Teléfono
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      className="form-control py-2 px-3"
                      value={mechanicForm.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="email">
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      name="email"
                      className="form-control py-2 px-3"
                      value={mechanicForm.email}
                      onChange={handleInputChange}
                      required
                    />

                    <small className="text-muted">
                      Este será el email que usará en el login.
                    </small>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="password">
                      Contraseña provisional
                    </label>

                    <input
                      id="password"
                      type="password"
                      name="password"
                      className="form-control py-2 px-3"
                      value={mechanicForm.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold" htmlFor="password_confirm">
                      Confirmar contraseña
                    </label>

                    <input
                      id="password_confirm"
                      type="password"
                      name="password_confirm"
                      className="form-control py-2 px-3"
                      value={mechanicForm.password_confirm}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <button
                      className={`btn w-100 py-3 fw-bold ${styles.btnLogin}`}
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Creando mecánico...
                        </>
                      ) : (
                        "Crear mecánico"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="bg-white border rounded-4 shadow-sm p-4">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
                <div>
                  <p className="text-uppercase text-muted small fw-semibold mb-2">
                    Accesos
                  </p>

                  <h2 className="h4 fw-bold mb-2">
                    Mecánicos registrados
                  </h2>

                  <p className="text-muted mb-0">
                    Lista de usuarios mecánicos que pueden entrar al sistema.
                  </p>
                </div>

                <button
                  className="btn btn-outline-secondary btn-sm px-3 align-self-start"
                  onClick={getMechanics}
                  disabled={isLoadingList}
                >
                  {isLoadingList ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar"
                  )}
                </button>
              </div>

              {isLoadingList ? (
                <div className="alert alert-secondary rounded-4 mb-0 d-flex align-items-center">
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Cargando mecánicos...
                </div>
              ) : mechanics.length === 0 ? (
                <div className="alert alert-warning rounded-4 mb-0">
                  Todavía no hay mecánicos registrados.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {mechanics.map((mechanic) => (
                        <tr key={mechanic.id || mechanic.email}>
                          <td>
                            <div className="fw-semibold">
                              {mechanic.first_name} {mechanic.last_name}
                            </div>

                            {mechanic.dni && (
                              <small className="text-muted">
                                DNI/NIE: {mechanic.dni}
                              </small>
                            )}
                          </td>

                          <td>{mechanic.email}</td>

                          <td>{mechanic.phone}</td>

                          <td>
                            <span className="badge text-bg-success rounded-pill">
                              Con acceso
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};