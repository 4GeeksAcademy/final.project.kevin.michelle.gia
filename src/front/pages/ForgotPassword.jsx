import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Login.module.css";

const RAW_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
  ? RAW_BACKEND_URL
  : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");
    setResetUrl("");

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Could not create reset link.");
        return;
      }

      setMessage(data.message || "Reset link created successfully.");

      if (data.reset_url) {
        setResetUrl(data.reset_url);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToResetPassword = () => {
    if (!resetUrl) return;

    if (resetUrl.startsWith("http")) {
      window.location.href = resetUrl;
      return;
    }

    navigate(resetUrl);
  };

  return (
    <div className={`container-fluid min-vh-100 ${styles.loginPage}`}>
      <div className={`row w-100 justify-content-center align-items-center ${styles.loginRow}`}>
        <div className={`card border-0 shadow-sm ${styles.loginCard}`}>
          <div className={styles.cardTopBar}></div>

          <div className="card-body p-4 p-md-5">
            <button
              type="button"
              className={`btn ${styles.backButton}`}
              onClick={() => navigate("/login")}
              aria-label="Back to login"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </button>

            <div className="mb-4">
              

              <h2 className={`fw-bold mt-3 mb-1 ${styles.titleHello}`}>
                Recover password
              </h2>

              <p className={styles.subtitle}>
                Enter your email and we&apos;ll create a reset link for your account.
              </p>
            </div>

            {error && (
              <div className={`alert py-2 small ${styles.errorAlert}`} role="alert">
                <i className="fa-solid fa-circle-exclamation me-2"></i>
                {error}
              </div>
            )}

            {message && (
              <div className={`alert py-2 small ${styles.successAlert}`} role="alert">
                <i className="fa-solid fa-circle-check me-2"></i>
                {message}
              </div>
            )}

            {resetUrl && (
              <div className={`alert small ${styles.warningAlert}`}>
                <p className="mb-2 fw-bold">Development reset link:</p>

                <button
                  type="button"
                  className={`btn btn-sm fw-bold ${styles.devResetButton}`}
                  onClick={handleGoToResetPassword}
                >
                  Go to reset password
                </button>
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label className={styles.inputLabel}>Email address</label>

                <input
                  type="email"
                  className={`form-control ${styles.loginInput}`}
                  placeholder="admin@workshop.com"
                  value={email}
                  disabled={loading}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                    setMessage("");
                    setResetUrl("");
                  }}
                  required
                />
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
                    Creating reset link...
                  </>
                ) : (
                  "Create reset link"
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className={styles.registerText}>
                Remember your password?{" "}
              </span>

              <Link to="/login" className={styles.registerLink}>
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};