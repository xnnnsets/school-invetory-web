import { apiFetch, getToken, setToken } from "./api";

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  if (!user) localStorage.removeItem("user");
  else localStorage.setItem("user", JSON.stringify(user));
}

export async function login(email, password) {
  const res = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
  setToken(res.accessToken);
  setUser(res.user);
  return res.user;
}

export function logout() {
  setToken(null);
  setUser(null);
}

export async function fetchMe() {
  const token = getToken();
  if (!token) throw new Error("NO_TOKEN");
  const res = await apiFetch("/api/auth/me", { skipUnauthorizedHandler: true });
  setUser(res.user);
  return res.user;
}

export function setRedirectAfterLogin(pathname) {
  if (!pathname) return;
  localStorage.setItem("redirectAfterLogin", pathname);
}

export function consumeRedirectAfterLogin() {
  const v = localStorage.getItem("redirectAfterLogin") || "/";
  localStorage.removeItem("redirectAfterLogin");
  return v;
}

