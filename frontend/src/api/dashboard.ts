const BASE_URL = 'http://localhost:5000';
const DEFAULT_ORG_ID = 'default-org';

export interface JurisdictionBreakdown {
  jurisdiction_id: string;
  tax_due: number;
  count: number;
}

export interface DashboardSummary {
  total_transactions: number;
  total_exposure: number;
  cross_border_count: number;
  classified_count: number;
  pending_count: number;
  jurisdiction_breakdown: JurisdictionBreakdown[];
  avg_confidence_score: number;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/api/dashboard/summary`, {
    headers: { 'x-org-id': DEFAULT_ORG_ID },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
