import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const Layout = () => {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar />

      <main className="flex-grow-1 d-flex overflow-hidden">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};