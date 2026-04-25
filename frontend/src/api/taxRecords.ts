export interface TaxRecord {
  _id: string;
  taxYear: number;
  entityName: string;
  entityId?: string;
  filingStatus?: 'filed' | 'pending' | 'amended' | 'unfiled';
  totalIncome?: number;
  taxableIncome?: number;
  taxAmount: number;
  taxPaid?: number;
  outstandingLiability?: number;
  jurisdiction?: string;
  filingDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  taxYear?: number | string;
  entityName?: string;
  filingStatus?: string;
  jurisdiction?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchTaxRecords(
  params: FetchParams
): Promise<{ data: TaxRecord[]; pagination: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.taxYear) query.set('taxYear', String(params.taxYear));
  if (params.entityName) query.set('entityName', params.entityName);
  if (params.filingStatus) query.set('filingStatus', params.filingStatus);
  if (params.jurisdiction) query.set('jurisdiction', params.jurisdiction);

  const res = await fetch(`http://localhost:5000/api/tax-records?${query.toString()}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function createTaxRecord(record: Partial<TaxRecord>): Promise<TaxRecord> {
  const res = await fetch('http://localhost:5000/api/tax-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
