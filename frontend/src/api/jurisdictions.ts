import { buildAuthHeaders } from "./auth";

const BASE_URL = "http://localhost:5000";

export interface Jurisdiction {
  _id: string;
  country_code: string;
  region_code?: string;
  name: string;
  currency: string;
  tax_authority_name?: string;
  active: boolean;
}

export async function fetchJurisdictions(): Promise<Jurisdiction[]> {
  const res = await fetch(`${BASE_URL}/api/jurisdictions`, { headers: buildAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  return (json as { data: Jurisdiction[] }).data;
}

export async function createJurisdiction(payload: Partial<Jurisdiction>): Promise<Jurisdiction> {
  const res = await fetch(`${BASE_URL}/api/jurisdictions`, {
    method: "POST",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  return (json as { data: Jurisdiction }).data;
}

export async function updateJurisdiction(id: string, payload: Partial<Jurisdiction>): Promise<Jurisdiction> {
  const res = await fetch(`${BASE_URL}/api/jurisdictions/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  return (json as { data: Jurisdiction }).data;
}
