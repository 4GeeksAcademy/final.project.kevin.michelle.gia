import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

export const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value
    });

    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Email o contraseña incorrectos.");
        return;
      }

      const token = data.token || data.access_token;

      if (!token || !data.user) {
        setError("La respuesta del servidor no trae token o usuario.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.employee) {
        localStorage.setItem("employee", JSON.stringify(data.employee));
      } else {
        localStorage.removeItem("employee");
      }

      navigate("/dashboard");
    } catch (error) {
      setError("No se pudo conectar con el servidor.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className={`card p-4 shadow-sm border-0 bg-white ${styles.loginCard}`}>
        <h2 className={`fw-bold m-0 text-dark ${styles.titleHello}`}>
          Bienvenido
        </h2>

        <h3 className={`fw-bold mb-4 text-dark ${styles.titleWelcome}`}>
          Iniciar sesión
        </h3>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}

            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
            ></button>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              name="email"
              className={`form-control py-3 px-4 border ${styles.loginInput}`}
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-4 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className={`form-control py-3 px-4 border ${styles.loginInput}`}
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleInputChange}
              required
            />

            <button
              type="button"
              className={`btn p-0 position-absolute top-50 end-0 translate-middle-y me-3 text-secondary ${styles.passwordEye}`}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>

          <button
            type="submit"
            className={`btn w-100 py-3 fw-bold ${styles.btnLogin}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <span className="text-secondary small">¿No tienes taller registrado? </span>

          <button
            type="button"
            className="btn btn-link p-0 text-dark fw-bold text-decoration-none small"
            onClick={() => navigate("/register")}
          >
            Crear cuenta admin
          </button>
        </div>
      </div>
    </div>
  );
};