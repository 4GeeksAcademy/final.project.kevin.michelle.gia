const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const createWorkshop = async (payload) => {
  const response = await fetch(`${BACKEND_URL}/api/workshops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${BACKEND_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};
const RAW_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001";
const API_BASE_URL = RAW_BACKEND_URL.endsWith("/api")
    ? RAW_BACKEND_URL
    : `${RAW_BACKEND_URL.replace(/\/$/, "")}/api`;

export async function apiFetch(path, { method = "GET", body } = {}) {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    return data;
}
