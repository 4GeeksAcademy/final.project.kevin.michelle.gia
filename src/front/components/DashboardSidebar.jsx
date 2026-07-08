import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {Home, LogOut, ClipboardPlus, Users, Car, Wrench } from "lucide-react";

const getStoredItem = (key) => {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

export const DashboardSidebar = ({ role, user, employee, onLogout }) => {
  const workshop = getStoredItem("workshop");
  const storedEmployee = getStoredItem("employee");
  const currentEmployee = employee || storedEmployee;

  const navigate = useNavigate();

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());

  const displayName =
    currentEmployee?.first_name && currentEmployee?.last_name
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : currentEmployee?.first_name ||
        user?.employee?.first_name ||
        user?.email ||
        "User";

  const roleLabel = role === "admin" ? "admin" : "mechanic";
  const homePath = role === "admin" ? "/admin" : "/mechanic";

  const getNavClass = ({ isActive }) =>
    `dashboard-sidebar-link ${isActive ? "active" : ""}`;

  return (
    <aside className="dashboard-sidebar">
      <div>
        <div className="dashboard-profile">
          <div className="dashboard-date">
            <span>Today is, {today}</span>
          </div>

          <button
            type="button"
            className="dashboard-brand"
            onClick={() => navigate(homePath)}
          >
            <span className="dashboard-welcome">
              Welcome Back {roleLabel},
            </span>
            <span className="dashboard-user-name">{displayName}</span>
          </button>

          <p className="dashboard-role">
            {role === "admin" ? "Admin dashboard" : "Mechanic dashboard"}
          </p>
        </div>

        {role === "admin" && (
          <>
            <button
              type="button"
              className="dashboard-new-task"
              onClick={() => navigate("/admin/services/new")}
            >
              <ClipboardPlus size={18} />
              <span>New Task</span>
            </button>

            <button
              type="button"
              className="dashboard-home-link"
              onClick={() => navigate(homePath)}
            >
              <Home size={18} />
              <span>Dashboard</span>
            </button>

            <nav className="dashboard-nav">
              <NavLink to="/admin/mechanics" className={getNavClass}>
                <Wrench size={18} />
                <span>Mechanics</span>
              </NavLink>

              <NavLink to="/admin/vehicles" className={getNavClass}>
                <Car size={18} />
                <span>Vehicles</span>
              </NavLink>

              <NavLink to="/admin/customers" className={getNavClass}>
                <Users size={18} />
                <span>Customers</span>
              </NavLink>
            </nav>
          </>
        )}

        {role === "mechanic" && (
          <nav className="dashboard-nav">
            <NavLink to="/mechanic" className={getNavClass}>
              <Wrench size={18} />
              <span>My Tasks</span>
            </NavLink>
          </nav>
        )}
      </div>

      <div className="dashboard-sidebar-bottom">
        {workshop && (
          <div className="dashboard-workshop-info">
            <strong className="dashboard-workshop-name">
              {workshop.company_name}
            </strong>

            {workshop.email && (
              <span className="dashboard-workshop-detail">
                {workshop.email}
              </span>
            )}

            {workshop.phone && (
              <span className="dashboard-workshop-detail">
                {workshop.phone}
              </span>
            )}

            {workshop.address && (
              <span className="dashboard-workshop-address">
                {workshop.address}
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          className="dashboard-logout"
          onClick={onLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};