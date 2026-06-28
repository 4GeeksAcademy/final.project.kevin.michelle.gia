import { createBrowserRouter, createRoutesFromElements, Route,} from "react-router-dom";

import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";

import { DashboardLayout } from "./pages/DashboardLayout";
import { AdminDashboard } from "./pages/AdminDashboard";
import { MechanicDashboard } from "./pages/MechanicDashboard";

import Customer from "./pages/CustomerList";
import { ServiceFormPage } from "./pages/ServiceFormPage";
import MechanicList from "./pages/MechanicList";
import VehicleList from "./pages/VehicleList";

const Routes = createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found! :c</h1>}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        {/* Esta ruta solo revisa el role y redirige a /admin o /mechanic */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* Admin routes con sidebar */}
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
                    <Customer />
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

        {/* Mechanic routes con sidebar */}
        <Route
            path="mechanic"
            element={
                <DashboardLayout allowedRole="mechanic">
                    <MechanicDashboard />
                </DashboardLayout>
            }
        />

        {/* Rutas viejas / pruebas */}
        <Route path="single/:theId" element={<Single />} />
        <Route path="demo" element={<Demo />} />
    </Route>
);

export const router = createBrowserRouter(Routes);