// 1. BACKEND URL CONFIGURATION

const DEFAULT_BACKEND_URL = "http://127.0.0.1:3001";
const backendUrl =
  import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL;

// Removes a possible trailing "/" from the URL.
const cleanBackendUrl = backendUrl.replace(/\/$/, "");

// If the URL already ends with "/api", keep it unchanged.
// Otherwise, add "/api".
const API_BASE_URL = cleanBackendUrl.endsWith("/api")
  ? cleanBackendUrl
  : `${cleanBackendUrl}/api`;

// 2. FUNCTION TO READ PUBLIC RESPONSES

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  return {
    // True if the response was successful.
    // False if an error occurred.
    ok: response.ok,

    status: response.status,
    data: data,
  };
}

// 3. WORKSHOP REGISTRATION

export async function registerWorkshop(payload) {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(payload),
  });

  return await parseResponse(response);
}

// 4. USER LOGIN

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      email: email,
      password: password,
    }),
  });

  return await parseResponse(response);
}

// 5. REQUESTS TO PROTECTED ENDPOINTS

export async function apiFetch(
  path,
  {
    method = "GET",
    body,
  } = {}
) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: method,
    headers: headers,

    body:
      body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      data.error ||
      data.message ||
      `HTTP ${response.status}`;

    throw new Error(errorMessage);
  }

  return data;
}