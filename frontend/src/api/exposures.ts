import { buildAuthHeaders } from './auth';
const BASE_URL = 'http://localhost:5000';

export interface TaxExposure {
  _id: string;
  transaction_id: string;
  org_id: string;
  jurisdiction_id: string;
  rule_id: string;
  tax_type: string;
  taxable_amount: number;
  tax_rate: number;
  gross_tax?: number;
  tax_credits_rebates?: number;
  surcharge_cess?: number;
  tax_due: number;
  confidence_score: number;
  calculated_at: string;
}

export interface TaxOrchestrationResult {
  transaction_id?: string;
  summary: {
    total_tax_due: number;
    rule_count: number;
    as_of: string;
  };
  jurisdiction: { _id: string; country_code: string };
  exposures: TaxExposure[];
}

export interface CalculateExposureResult {
  primary: TaxExposure | null;
  orchestration: TaxOrchestrationResult | null;
}

export async function calculateExposure(transactionId: string): Promise<CalculateExposureResult> {
  const res = await fetch(`${BASE_URL}/api/exposures/calculate/${transactionId}`, {
    method: 'POST',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = (await res.json()) as {
    data: TaxExposure | null;
    meta?: { orchestration: TaxOrchestrationResult };
  };
  return {
    primary: json.data,
    orchestration: json.meta?.orchestration ?? null,
  };
}

/** Full orchestrator response (same engine as calculate; use for integrations). */
export async function runTaxOrchestrator(transactionId: string, asOf?: string) {
  const res = await fetch(`${BASE_URL}/api/tax-orchestrator/run/${transactionId}`, {
    method: 'POST',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(asOf ? { asOf } : {}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<{
    success: boolean;
    data: TaxOrchestrationResult & { transaction_id: string };
  }>;
}

export async function fetchExposuresByTransaction(transactionId: string): Promise<TaxExposure[]> {
  const res = await fetch(`${BASE_URL}/api/exposures/transaction/${transactionId}`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchAllExposures(): Promise<TaxExposure[]> {
  const res = await fetch(`${BASE_URL}/api/exposures`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
