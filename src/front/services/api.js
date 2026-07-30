// 1. BACKEND URL CONFIGURATION

const DEFAULT_BACKEND_URL = "http://127.0.0.1:3001";

const backendUrl = import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL;

const cleanBackendUrl = backendUrl.replace(/\/$/, "");

const API_BASE_URL = cleanBackendUrl.endsWith("/api") ? cleanBackendUrl : `${cleanBackendUrl}/api`;

// 2. FUNCTION TO READ PUBLIC RESPONSES

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  return {

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

// 6. SERVICE STATUS HISTORY

export async function getServiceStatusLogs(serviceId) {
  return await apiFetch(
    `/services/${serviceId}/status-logs`
  );
}
// 7. UPDATE A SERVICE COMMENT

export async function updateServiceComment(
  serviceId,
  commentId,
  payload
) {
  return await apiFetch(
    `/services/${serviceId}/comments/${commentId}`,
    {
      method: "PATCH",
      body: payload,
    }
  );
}

// 8. DELETE A SERVICE COMMENT

export async function deleteServiceComment(
  serviceId,
  commentId
) {
  return await apiFetch(
    `/services/${serviceId}/comments/${commentId}`,
    {
      method: "DELETE",
    }
  );
}

// 9. CANCEL A SERVICE

export async function cancelService(
  serviceId,
  reason = ""
) {
  return await apiFetch(
    `/services/${serviceId}/cancel`,
    {
      method: "PATCH",
      body: {
        reason: reason,
      },
    }
  );
}

// 10. PERMANENTLY DELETE A SERVICE

export async function permanentlyDeleteService(serviceId) {
  return await apiFetch(
    `/services/${serviceId}`,
    {
      method: "DELETE",
      body: {
        confirm: true,
      },
    }
  );
}