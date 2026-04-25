import { buildAuthHeaders } from "./auth";

const BASE_URL = "http://localhost:5000";

export interface Organization {
  _id: string;
  legal_name: string;
  entity_type: string;
  country_of_incorporation: string;
  tax_identification_number?: string;
  org_tier?: "starter" | "growth" | "enterprise";
  is_active: boolean;
}

export async function fetchMyOrganization(): Promise<Organization> {
  const res = await fetch(`${BASE_URL}/api/organizations/me`, {
    headers: buildAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  return (json as { data: Organization }).data;
}

export async function updateMyOrganization(payload: Partial<Organization>): Promise<Organization> {
  const res = await fetch(`${BASE_URL}/api/organizations/me`, {
    method: "PATCH",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  return (json as { data: Organization }).data;
}
