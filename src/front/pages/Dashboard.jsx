import React from "react";
import { Navigate } from "react-router-dom";

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

export const Dashboard = () => {
  const token = localStorage.getItem("token");
  const user = getStoredObject("user");
  const employee = getStoredObject("employee");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = (employee?.role || user?.role || "").toLowerCase();

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (role === "mechanic") {
    return <Navigate to="/mechanic" replace />;
  }

  return <Navigate to="/login" replace />;
};