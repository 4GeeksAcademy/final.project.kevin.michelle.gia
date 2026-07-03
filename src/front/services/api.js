const RAW_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:3001";

const CLEAN_BACKEND_URL = RAW_BACKEND_URL.replace(/\/$/, "");

const API_BASE_URL = CLEAN_BACKEND_URL.endsWith("/api")
  ? CLEAN_BACKEND_URL
  : `${CLEAN_BACKEND_URL}/api`;

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
};


////////////////////////Register////////////////////////////////////////
export const registerWorkshop = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return await parseResponse(response);
};
////////////////////////login///////

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  return await parseResponse(response);
};

///////////////AUTHENTICATED FETCH (endpoints -> login)//////////////

export async function apiFetch(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }

  return data;
}