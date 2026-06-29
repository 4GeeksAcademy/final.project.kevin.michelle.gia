import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";

const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Login failed. Please try again");
        return;
      }

      if (!data.token || !data.user || !data.employee) {
        setError("Login response is missing token, user, or employee data.");
        console.log("Login response:", data);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("employee", JSON.stringify(data.employee));

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server");
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className={`card p-4 shadow-sm border-0 ${styles.loginCard}`}>
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className={`btn p-0 text-danger ${styles.backArrow}`}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </div>

        <h2 className={`fw-bold m-0 text-dark ${styles.titleHello}`}>
          Hello there!
        </h2>

        <h3 className={`fw-bold mb-4 text-dark ${styles.titleWelcome}`}>
          Welcome Back
        </h3>

        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <input
              type="email"
              className={`form-control py-3 px-4 ${styles.loginInput}`}
              placeholder="E-mail address"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-2 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control py-3 px-4 ${styles.loginInput}`}
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className={`btn p-0 position-absolute top-50 end-0 translate-middle-y me-3 text-secondary ${styles.passwordEye}`}
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
            </button>
          </div>

          <div className="text-end mb-4">
            <a href="#" className="text-danger text-decoration-none small fw-semibold">
              Forgot your password?
            </a>
          </div>

          <button type="submit" className={`btn w-100 py-3 fw-bold ${styles.btnLogin}`}>
            Log In
          </button>
        </form>

        <div className="text-center mt-2">
          <span className="text-secondary small">Don't have an account? </span>

          <Link
            to="/registro/coordinador"
            className="text-dark fw-bold text-decoration-none small"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};