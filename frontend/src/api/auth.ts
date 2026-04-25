const BASE_URL = "http://localhost:5000";

export interface RegisterPayload {
  organization: {
    legal_name: string;
    entity_type: string;
    country_of_incorporation: string;
    tax_identification_number?: string;
    org_tier?: "starter" | "growth" | "enterprise";
  };
  user: {
    full_name: string;
    email: string;
    password: string;
    role?: "admin" | "manager" | "analyst" | "viewer";
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  _id?: string;
  id?: string;
  full_name: string;
  email: string;
  role: "admin" | "manager" | "analyst" | "viewer";
  org_id: string;
}

export function getAuthToken() {
  return localStorage.getItem("aether_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("aether_token", token);
}

export function clearAuthToken() {
  localStorage.removeItem("aether_token");
}

export function getOrgId() {
  return localStorage.getItem("aether_org_id") || "default-org";
}

function setOrgId(orgId: string) {
  localStorage.setItem("aether_org_id", String(orgId));
}

export function buildAuthHeaders(extraHeaders?: Record<string, string>) {
  const token = getAuthToken();
  if (token) {
    return {
      ...(extraHeaders || {}),
      Authorization: `Bearer ${token}`,
    };
  }
  return {
    ...(extraHeaders || {}),
    "x-org-id": getOrgId(),
  };
}

export async function register(payload: RegisterPayload) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const token = (json as { data?: { token?: string } }).data?.token;
  const orgId = (json as { data?: { organization?: { _id?: string } } }).data?.organization?._id;
  if (token) {
    setAuthToken(token);
  }
  if (orgId) {
    setOrgId(orgId);
  }
  return json;
}

export async function login(payload: LoginPayload) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const token = (json as { data?: { token?: string } }).data?.token;
  const orgId = (json as { data?: { user?: { org_id?: string } } }).data?.user?.org_id;
  if (token) {
    setAuthToken(token);
  }
  if (orgId) {
    setOrgId(orgId);
  }
  return json;
}

export async function fetchMe() {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: buildAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  return (json as { data: AuthUser }).data;
}
