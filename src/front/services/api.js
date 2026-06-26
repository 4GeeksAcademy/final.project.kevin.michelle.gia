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