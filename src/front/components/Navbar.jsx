import { Link } from "react-router-dom";

export const Navbar = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            
            <Link to="/vehiculos/nuevo" className="btn btn-primary ms-2">
                ➕ Nuevo vehículo
            </Link>
        </nav>
    );
};
