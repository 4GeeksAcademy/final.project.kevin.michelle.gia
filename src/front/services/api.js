const BASE_URL = import.meta.env.VITE_BACKEND_URL;

if (!BASE_URL) {
    console.warn("⚠️ VITE_BACKEND_URL no está definida en .env");
}


async function request(path, options = {}) {
    const url = `${BASE_URL}/api${path}`;
    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    };

    const response = await fetch(url, config);

    let data = null;
    try {
        data = await response.json();
    } catch (_) {
        
    }

    if (!response.ok) {
        const mensaje =
            data?.message || data?.msg || `Error HTTP ${response.status}`;
        throw new Error(mensaje);
    }
    return data;
}



export const listarClientes = () => request("/clientes");

export const crearCliente = (cliente) =>
    request("/clientes", {
        method: "POST",
        body: JSON.stringify(cliente),
    });



export const listarVehiculos = () => request("/vehiculos");

export const crearVehiculo = (vehiculo) =>
    request("/vehiculos", {
        method: "POST",
        body: JSON.stringify(vehiculo),
    });