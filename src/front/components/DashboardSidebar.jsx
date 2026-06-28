import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, LogOut, ClipboardPlus, Users, Car, Wrench } from "lucide-react";

export const DashboardSidebar = ({ role, user, employee, onLogout }) => {
  const navigate = useNavigate();

  const displayName =
    employee?.first_name ||
    user?.employee?.first_name ||
    user?.email ||
    "User";

  const homePath = role === "admin" ? "/admin" : "/mechanic";

  const getNavClass = ({ isActive }) =>
    `dashboard-sidebar-link ${isActive ? "active" : ""}`;

  return (
    <aside className="dashboard-sidebar">
      <div>
        <button
          type="button"
          className="dashboard-brand"
          onClick={() => navigate(homePath)}
        >
          <span className="dashboard-welcome">Welcome back,</span>
          <span className="dashboard-user-name">{displayName}</span>
        </button>

        <p className="dashboard-role">
          {role === "admin" ? "Admin dashboard" : "Mechanic dashboard"}
        </p>

        

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
              <button
                type="button"
                className="dashboard-sidebar-link disabled"
                disabled
              >
                <Wrench size={18} />
                <span>Mechanics</span>
              </button>

              <button
                type="button"
                className="dashboard-sidebar-link disabled"
                disabled
              >
                <Car size={18} />
                <span>Vehicles</span>
              </button>

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

      <button
        type="button"
        className="dashboard-logout"
        onClick={onLogout}
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
};