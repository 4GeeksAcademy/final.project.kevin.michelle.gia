import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

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

export const MechanicDashboard = ({ user }) => {
  const navigate = useNavigate();
  const employee = getStoredObject("employee");

  const mechanicName = employee
    ? `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
    : "Mecánico";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("employee");

    navigate("/login");
  };

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <main className="container">
        <header className="bg-white border rounded-4 shadow-sm p-4 mb-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3">
            <div>
              <p className="text-uppercase text-danger small fw-bold mb-2">
                Panel del mecánico
              </p>

              <h1 className="fw-bold text-dark mb-2">
                Hola, {mechanicName}
              </h1>

              <p className="text-muted mb-3">
                Aquí verás tus coches asignados y podrás actualizar el estado de cada reparación.
              </p>

              <div className="d-flex flex-column flex-md-row gap-2">
                <span className="badge text-bg-dark  px-3 py-2">
                  {user?.role || "mechanic"}
                </span>

                <span className="badge text-bg-light border text-dark px-3 py-2">
                  {user?.email || "Sin email"}
                </span>
              </div>
            </div>

            <button
              className="btn btn-outline-danger btn-sm px-3"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
              <p className="text-muted small mb-1">Asignados</p>
              <h2 className="fw-bold mb-0">0</h2>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
              <p className="text-muted small mb-1">En reparación</p>
              <h2 className="fw-bold mb-0">0</h2>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="bg-white border rounded-4 shadow-sm p-3 h-100">
              <p className="text-muted small mb-1">Terminados</p>
              <h2 className="fw-bold mb-0">0</h2>
            </div>
          </div>
        </section>

        <section className="bg-white border rounded-4 shadow-sm p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
            <div>
              <p className="text-uppercase text-muted small fw-semibold mb-2">
                Mi trabajo
              </p>

              <h2 className="h4 fw-bold mb-2">
                Reparaciones asignadas
              </h2>

              <p className="text-muted mb-0">
                Más adelante aquí aparecerán los vehículos que el admin te haya asignado.
              </p>
            </div>

            <button
              type="button"
              className={`btn px-4 py-2 fw-bold align-self-start ${styles.btnLogin}`}
            >
              Actualizar estado
            </button>
          </div>

          <div className="border rounded-4 bg-light p-4 text-center">
            <p className="text-muted mb-0">
              Todavía no tienes reparaciones asignadas.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};