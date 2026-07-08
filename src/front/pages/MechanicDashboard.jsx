import React from "react";
import { ServiceStatusBoard } from "../components/ServiceStatusBoard";

export const MechanicDashboard = () => {
  return (
    <section className="admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>My Tasks</h1>
      </div>

      <div className="admin-board-card">
        <ServiceStatusBoard role="mechanic" />
      </div>
    </section>
  );
};