import { buildAuthHeaders } from "./auth";

const BASE_URL = "http://localhost:5000";

export interface JurisdictionRule {
  _id: string;
  jurisdiction_id: string;
  rule_type: string;
  tax_category: string;
  standard_rate: number;
  rule_logic?: string;
  valid_from: string;
  valid_to?: string | null;
  source_reference?: string;
  oecd_framework_tag?: string;
  active: boolean;
}

export async function fetchRules(): Promise<JurisdictionRule[]> {
  const res = await fetch(`${BASE_URL}/api/jurisdictional-rules`, { headers: buildAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  return (json as { data: JurisdictionRule[] }).data;
}

export async function createRule(payload: Partial<JurisdictionRule>): Promise<JurisdictionRule> {
  const res = await fetch(`${BASE_URL}/api/jurisdictional-rules`, {
    method: "POST",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  return (json as { data: JurisdictionRule }).data;
}

export async function updateRule(id: string, payload: Partial<JurisdictionRule>): Promise<JurisdictionRule> {
  const res = await fetch(`${BASE_URL}/api/jurisdictional-rules/${id}`, {
    method: "PATCH",
    headers: buildAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed with status ${res.status}`);
  return (json as { data: JurisdictionRule }).data;
}
