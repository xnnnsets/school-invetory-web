// Prefer same-origin in production (behind reverse proxy), but allow override.
const API_BASE = import.meta.env.VITE_API_BASE || "";

let onUnauthorized = null;

export function getToken() {
  return localStorage.getItem("accessToken");
}

export function setToken(token) {
  if (!token) localStorage.removeItem("accessToken");
  else localStorage.setItem("accessToken", token);
}

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

export async function apiFetch(path, { method = "GET", body, token, skipUnauthorizedHandler = false } = {}) {
  const headers = { "content-type": "application/json" };
  const t = token ?? getToken();
  if (t) headers.authorization = `Bearer ${t}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (!skipUnauthorizedHandler && res.status === 401 && typeof onUnauthorized === "function") {
      onUnauthorized();
    }
    const message = data?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

