import React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import logoTaller from "../assets/img/logoTaller.png";

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");

  const isDashboardArea =
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/mechanic");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("employee");
    localStorage.removeItem("workshop");

    navigate("/login");
    window.location.reload();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-warning p-0">
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={logoTaller}
            alt="Workshop Manager logo"
            height="48"
            className="d-inline-block align-text-top"
          />
        </Link>

        {!isDashboardArea && (
          <>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNavbar"
              aria-controls="mainNavbar"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="mainNavbar">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2">
                <li className="nav-item">
                  <NavLink className="nav-link fw-semibold" to="/">
                    Home
                  </NavLink>
                </li>

                {token && (
                  <li className="nav-item">
                    <NavLink className="nav-link fw-semibold" to="/dashboard">
                      Dashboard
                    </NavLink>
                  </li>
                )}

                {!token && (
                  <>
                    <li className="nav-item">
                      <NavLink className="nav-link fw-semibold" to="/login">
                        Login
                      </NavLink>
                    </li>

                    <li className="nav-item">
                      <NavLink className="btn btn-warning fw-bold px-3" to="/register">
                        Register
                      </NavLink>
                    </li>
                  </>
                )}

                {token && (
                  <li className="nav-item">
                    <button
                      type="button"
                      className="btn btn-warning fw-bold px-3"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};