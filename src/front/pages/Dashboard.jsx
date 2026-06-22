import React from "react";
import { Navigate } from "react-router-dom";
import { AdminDashboard } from "./AdminDashboard";
import { MechanicDashboard } from "./MechanicDashboard";

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

export const Dashboard = () => {
  const token = localStorage.getItem("token");
  const user = getStoredObject("user");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role ? user.role.toLowerCase() : "";

  if (role === "admin") {
    return <AdminDashboard user={user} />;
  }

  if (role === "mechanic") {
    return <MechanicDashboard user={user} />;
  }

  return <Navigate to="/" replace />;
};