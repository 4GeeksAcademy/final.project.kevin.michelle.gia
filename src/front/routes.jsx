import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { DashboardRedirect } from "./pages/DashboardRedirect";

import { DashboardLayout } from "./pages/DashboardLayout";
import { AdminDashboard } from "./pages/AdminDashboard";
import { MechanicDashboard } from "./pages/MechanicDashboard";

import CustomerList from "./pages/CustomerList";
import MechanicList from "./pages/MechanicList";
import VehicleList from "./pages/VehicleList";
import { ServiceFormPage } from "./pages/ServiceFormPage";

const Routes = createRoutesFromElements(
  <Route
    path="/"
    element={<Layout />}
    errorElement={<h1>Not found! :c</h1>}
  >
    <Route index element={<Home />} />

    <Route path="login" element={<Login />} />
    <Route path="register" element={<Register />} />
    <Route
      path="forgot-password"
      element={<ForgotPassword />}
    />

    <Route
      path="dashboard"
      element={<DashboardRedirect />}
    />

    <Route
      path="admin"
      element={
        <DashboardLayout allowedRole="admin">
          <AdminDashboard />
        </DashboardLayout>
      }
    />

    <Route
      path="admin/customers"
      element={
        <DashboardLayout allowedRole="admin">
          <CustomerList />
        </DashboardLayout>
      }
    />

    <Route
      path="admin/mechanics"
      element={
        <DashboardLayout allowedRole="admin">
          <MechanicList />
        </DashboardLayout>
      }
    />

    <Route
      path="admin/vehicles"
      element={
        <DashboardLayout allowedRole="admin">
          <VehicleList />
        </DashboardLayout>
      }
    />

    <Route
      path="admin/services/new"
      element={
        <DashboardLayout allowedRole="admin">
          <ServiceFormPage />
        </DashboardLayout>
      }
    />

    <Route
      path="mechanic"
      element={
        <DashboardLayout allowedRole="mechanic">
          <MechanicDashboard />
        </DashboardLayout>
      }
    />
  </Route>
);

export const router = createBrowserRouter(Routes);