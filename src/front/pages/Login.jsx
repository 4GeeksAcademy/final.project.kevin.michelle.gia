import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";
import little_logo from "../assets/img/little_logo.png";

const RAW_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Login failed. Please try again.");
        return;
      }

      if (!data.token || !data.user || !data.employee) {
        setError("Login response is missing token, user or employee data.");
        console.log("Login response:", data);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("employee", JSON.stringify(data.employee));

      if (data.workshop) {
        localStorage.setItem("workshop", JSON.stringify(data.workshop));
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container-fluid min-vh-100 ${styles.loginPage}`}>
      <div className={`row w-100 justify-content-center align-items-center ${styles.loginRow}`}>
        <div className={`card border-0 shadow-sm ${styles.loginCard}`}>
          <div className={styles.cardTopBar}></div>

          <div className="card-body p-4 p-md-5">
            <button
              type="button"
              onClick={() => navigate("/")}
              className={`btn ${styles.backButton}`}
              aria-label="Back to home"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>

            <div className="mb-4 text-center">

              <div className={styles.loginLogoBox}>
                <img src={little_logo} alt="Workshop Manager simple logo" className={styles.loginLogo}/>
              </div>

              <h2 className={`fw-bold mt-4 mb-1 ${styles.titleHello}`}>
                Hello there!
              </h2>

              <p className={styles.subtitle}>
                Welcome back to your workshop
              </p>
            </div>

            {error && (
              <div className={`alert py-2 small ${styles.errorAlert}`} role="alert">
                <i className="fa-solid fa-circle-exclamation me-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className={styles.inputLabel}>Email address</label>

                <input
                  type="email"
                  className={`form-control ${styles.loginInput}`}
                  placeholder="admin@workshop.com"
                  value={email}
                  required
                  disabled={loading}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                />
              </div>

              <div className="mb-2">
                <label className={styles.inputLabel}>Password</label>

                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`form-control ${styles.loginInput} ${styles.passwordInput}`}
                    placeholder="Enter your password"
                    value={password}
                    required
                    disabled={loading}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError(null);
                    }}
                  />

                  <button
                    type="button"
                    className={`btn position-absolute top-50 end-0 translate-middle-y ${styles.passwordEye}`}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label="Show or hide password"
                  >
                    <i
                      className={`fa-solid ${
                        showPassword ? "fa-eye" : "fa-eye-slash"
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              <div className="text-end mb-4">
                <Link
                  to="/forgot-password"
                  className={styles.forgotLink}
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                className={`btn w-100 fw-bold ${styles.btnLogin}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      aria-hidden="true"
                    ></span>
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className={styles.registerText}>
                Don&apos;t have an account?{" "}
              </span>

              <Link
                to="/register"
                className={styles.registerLink}
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};