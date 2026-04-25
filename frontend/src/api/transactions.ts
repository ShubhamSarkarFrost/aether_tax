import { buildAuthHeaders, getOrgId } from './auth';
const BASE_URL = 'http://localhost:5000';

export interface Transaction {
  _id: string;
  org_id: string;
  transaction_type: 'sale' | 'purchase' | 'service' | 'royalty' | 'dividend' | 'interest';
  amount: number;
  currency: string;
  originating_country: string;
  destination_country: string;
  is_intercompany: boolean;
  cross_border: boolean;
  classification_status: 'pending' | 'classified' | 'rejected';
  classified_at?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionPayload {
  org_id?: string;
  transaction_type: string;
  amount: number;
  currency: string;
  originating_country: string;
  destination_country: string;
  is_intercompany?: boolean;
  notes?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchTransactionsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function fetchTransactions(
  params: FetchTransactionsParams = {}
): Promise<{ data: Transaction[]; pagination: PaginationMeta }> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const res = await fetch(`${BASE_URL}/api/transactions?${query.toString()}`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const res = await fetch(`${BASE_URL}/api/transactions/${id}`, {
    headers: buildAuthHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  const res = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders({ 'Content-Type': 'application/json' }),
    },
    body: JSON.stringify({ ...payload, org_id: payload.org_id || getOrgId() }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export async function classifyTransaction(
  id: string,
  status: 'classified' | 'rejected'
): Promise<Transaction> {
  const res = await fetch(`${BASE_URL}/api/transactions/${id}/classify`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders({ 'Content-Type': 'application/json' }),
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
