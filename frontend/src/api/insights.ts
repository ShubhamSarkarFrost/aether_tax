import { buildAuthHeaders } from './auth';

const BASE_URL = 'http://localhost:5000';

export interface TaxRateInsightItem {
  countryCode: string;
  taxType: string;
  label: string;
  ratePercent: number | null;
  notes?: string;
  sourceHint?: string;
}

export interface TaxRateInsightResponse {
  model: string;
  retrievedAt: string;
  disclaimer: string;
  items: TaxRateInsightItem[];
}

export async function fetchTaxRateInsights(
  countryCodes: string[],
  asOf?: string
): Promise<TaxRateInsightResponse> {
  const params = new URLSearchParams();
  params.set('countries', countryCodes.join(','));
  if (asOf) params.set('asOf', asOf);
  const res = await fetch(`${BASE_URL}/api/insights/tax-rates?${params.toString()}`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = (await res.json()) as { data: TaxRateInsightResponse };
  return json.data;
}

export interface SuggestedRuleRate {
  model: string;
  standardRate: number;
  label: string;
  notes: string;
}

export async function fetchSuggestedRuleRate(params: {
  country: string;
  taxCategory: string;
  ruleType?: string;
}): Promise<SuggestedRuleRate> {
  const sp = new URLSearchParams();
  sp.set('country', params.country);
  sp.set('taxCategory', params.taxCategory);
  if (params.ruleType) sp.set('ruleType', params.ruleType);
  const res = await fetch(`${BASE_URL}/api/insights/suggested-rule-rate?${sp.toString()}`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = (await res.json()) as { data: SuggestedRuleRate };
  return json.data;
}
