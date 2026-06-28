import React from "react";
import { ServiceStatusBoard } from "../components/ServiceStatusBoard";

export const AdminDashboard = () => {
  return (
    <section className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>Status Dashboard</h1>
      </div>

      <div className="admin-board-card">
        <ServiceStatusBoard />
      </div>
    </section>
  );
};