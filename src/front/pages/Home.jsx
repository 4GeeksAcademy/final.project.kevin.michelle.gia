import { Link } from "react-router-dom";

export const Home = () => {
  return (
    <div className="container-fluid p-0">

      {/* HERO */}
      <section className="bg-dark text-light py-5">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <h1 className="display-4 fw-bold">
                Gestiona tu taller mecánico <br />
                <span className="text-warning">sin perder el control</span>
              </h1>
              <p className="lead mt-3">
                Asigna vehículos a tus mecánicos, controla el estado de cada
                reparación y comunica a tus clientes el avance en tiempo real.
              </p>
              <div className="d-flex gap-3 mt-4 flex-wrap">
                <Link to="/registro/coordinador" className="btn btn-warning btn-lg">
                  Dar de alta mi taller
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-5">
        <h2 className="text-center mb-5">¿Qué incluye AppTalleres?</h2>
        <div className="row g-4">
          {[
            { icon: "📋", title: "Fichas de coche", text: "Matrícula, modelo, cliente, estado y prioridad de cada vehículo." },
            { icon: "👨‍🔧", title: "Roles diferenciados", text: "Coordinador supervisa, mecánico ejecuta. Cada uno ve lo que necesita." },
            { icon: "🚦", title: "Estado en tiempo real", text: "Entrada, diagnóstico, esperando piezas, en reparación, finalizado, entregado." },
            { icon: "📊", title: "Historial por vehículo", text: "Toda la trazabilidad de servicios de cada coche que pasa por tu taller." },
          ].map((f, i) => (
            <div className="col-md-6 col-lg-3" key={i}>
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div style={{ fontSize: "3rem" }}>{f.icon}</div>
                  <h5 className="mt-3">{f.title}</h5>
                  <p className="text-muted small">{f.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-warning py-5">
        <div className="container text-center">
          <h2>¿Listo para empezar?</h2>
          <p className="lead">Registra tu taller en menos de 2 minutos.</p>
          <Link to="/registro/coordinador" className="btn btn-dark btn-lg">
            Crear cuenta gratis
          </Link>
        </div>
      </section>

    </div>
  );
};
