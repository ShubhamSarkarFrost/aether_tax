import { buildAuthHeaders } from './auth';
const BASE_URL = 'http://localhost:5000';

export interface JurisdictionBreakdown {
  jurisdiction_id: string;
  tax_due: number;
  count: number;
}

export interface JurisdictionLabeled {
  jurisdiction_id: string;
  country_code?: string;
  name?: string;
  tax_due: number;
  count: number;
}

export interface ExposureByTaxType {
  tax_type: string;
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
  /** When present (newer API), includes ISO country and name for charts. */
  jurisdiction_labeled?: JurisdictionLabeled[];
  exposure_by_tax_type?: ExposureByTaxType[];
  avg_confidence_score: number;
  total_tax_records: number;
  filing_status_counts: {
    filed: number;
    pending: number;
    amended: number;
    unfiled: number;
    unknown: number;
  };
  total_tax_amount: number;
  total_tax_paid: number;
  total_outstanding_liability: number;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${BASE_URL}/api/dashboard/summary`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
