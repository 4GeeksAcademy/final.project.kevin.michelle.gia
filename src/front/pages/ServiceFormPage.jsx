import React from "react";
import { useNavigate } from "react-router-dom";
import { ServiceForm } from "../components/ServiceForm";

export const ServiceFormPage = () => {
  const navigate = useNavigate();

  const handleServiceCreated = () => {
    setTimeout(() => {
      navigate("/admin");
    }, 800);
  };

  return (
    <section className="service-ticket-page">
      <div className="service-ticket-header">
        <button
          type="button"
          className="service-ticket-back-button"
          onClick={() => navigate("/admin")}
        >
          ← Back to dashboard
        </button>

        <h1>New Service Ticket</h1>

        <p>
          Register the customer, vehicle and repair request in one flow.
        </p>
      </div>

      <ServiceForm onServiceCreated={handleServiceCreated} />
    </section>
  );
};