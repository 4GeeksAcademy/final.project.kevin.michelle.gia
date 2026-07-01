import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { DashboardSidebar } from "../components/DashboardSidebar";

const getStoredObject = (key) => {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    localStorage.removeItem(key);
    return null;
  }
};

export const DashboardLayout = ({ allowedRole, children }) => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = getStoredObject("user");
  const employee = getStoredObject("employee");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = (employee?.role || user?.role || "").toLowerCase();

  if (allowedRole && role !== allowedRole) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "mechanic") return <Navigate to="/mechanic" replace />;

    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("employee");

    navigate("/login");
  };

  return (
  <div className="dashboard-shell">
    <DashboardSidebar
      role={role}
      user={user}
      employee={employee}
      onLogout={handleLogout}
    />

    <main className="dashboard-main">
      {children}
    </main>
  </div>
);
};