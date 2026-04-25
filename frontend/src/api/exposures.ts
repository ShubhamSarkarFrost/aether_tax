const BASE_URL = 'http://localhost:5000';
const DEFAULT_ORG_ID = 'default-org';

export interface TaxExposure {
  _id: string;
  transaction_id: string;
  org_id: string;
  jurisdiction_id: string;
  rule_id: string;
  tax_type: string;
  taxable_amount: number;
  tax_rate: number;
  tax_due: number;
  confidence_score: number;
  calculated_at: string;
}

export async function calculateExposure(transactionId: string): Promise<TaxExposure> {
  const res = await fetch(`${BASE_URL}/api/exposures/calculate/${transactionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-org-id': DEFAULT_ORG_ID,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchExposuresByTransaction(transactionId: string): Promise<TaxExposure[]> {
  const res = await fetch(`${BASE_URL}/api/exposures/transaction/${transactionId}`, {
    headers: { 'x-org-id': DEFAULT_ORG_ID },
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
    headers: { 'x-org-id': DEFAULT_ORG_ID },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
