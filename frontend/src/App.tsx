import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  createTaxRecord,
  fetchTaxRecords,
  updateTaxRecordFilingStatus,
  uploadTaxRecords,
} from './api/taxRecords';
import type { TaxRecord, PaginationMeta } from './api/taxRecords';
import { fetchJurisdictions } from './api/jurisdictions';
import type { Jurisdiction } from './api/jurisdictions';
import TaxRecordsFilters, { type TaxRecordsFilterState } from './components/TaxRecordsFilters';
import TaxRecordsTable from './components/TaxRecordsTable';
import Pagination from './components/Pagination';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import JurisdictionsPage from './pages/JurisdictionsPage';
import LoginPage from './pages/LoginPage';
import NewTransactionPage from './pages/NewTransactionPage';
import RegisterPage from './pages/RegisterPage';
import RulesPage from './pages/RulesPage';
import SettingsPage from './pages/SettingsPage';

const DEFAULT_FILTERS: TaxRecordsFilterState = {
  taxYear: '',
  entityName: '',
  filingStatus: '',
  jurisdictionId: '',
};

function TaxRecordsPage() {
  const inputClass =
    'border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc6900]';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';
  const [filters, setFilters] = useState<TaxRecordsFilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TaxRecordsFilterState>(DEFAULT_FILTERS);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('taxYear');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [createForm, setCreateForm] = useState({
    taxYear: String(new Date().getFullYear()),
    entityName: '',
    taxAmount: '',
    filingStatus: 'pending',
    jurisdiction_id: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTaxRecords({
        page,
        limit: 20,
        sortBy,
        sortOrder,
        taxYear: appliedFilters.taxYear || undefined,
        entityName: appliedFilters.entityName || undefined,
        filingStatus: appliedFilters.filingStatus || undefined,
        jurisdictionId: appliedFilters.jurisdictionId || undefined,
      });
      setRecords(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tax records');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, appliedFilters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        setJurisdictions(await fetchJurisdictions());
      } catch {
        // catalog optional for page shell; list still works
      }
    })();
  }, []);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  }

  function handleApply() {
    setAppliedFilters(filters);
    setPage(1);
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  async function handleCreateTaxRecord(e: React.FormEvent) {
    e.preventDefault();
    const hasManualInput =
      Boolean(createForm.taxYear.trim()) ||
      Boolean(createForm.entityName.trim()) ||
      Boolean(createForm.taxAmount.trim());
    const hasCompleteManualInput =
      Boolean(createForm.taxYear.trim()) &&
      Boolean(createForm.entityName.trim()) &&
      Boolean(createForm.taxAmount.trim());

    if (!uploadFile && !hasManualInput) {
      setError('Enter tax year, entity name, tax amount and filing status, or upload a .json/.csv file');
      return;
    }

    if (!uploadFile && hasManualInput && !hasCompleteManualInput) {
      setError('Complete tax year, entity name, and tax amount for manual entry, or upload a file');
      return;
    }

    setError(null);
    setCreating(true);
    try {
      if (hasCompleteManualInput) {
        await createTaxRecord({
          taxYear: Number(createForm.taxYear),
          entityName: createForm.entityName,
          taxAmount: Number(createForm.taxAmount),
          filingStatus: createForm.filingStatus as 'filed' | 'pending' | 'amended' | 'unfiled',
          jurisdiction_id: createForm.jurisdiction_id || undefined,
        });
      }

      if (uploadFile) {
        const text = await uploadFile.text();
        let parsed: Partial<TaxRecord>[] = [];
        if (uploadFile.name.toLowerCase().endsWith('.json')) {
          const json = JSON.parse(text);
          parsed = Array.isArray(json) ? json : json.records;
        } else if (uploadFile.name.toLowerCase().endsWith('.csv')) {
          parsed = parseCsv(text);
        } else {
          throw new Error('Unsupported file type. Upload .json or .csv file');
        }
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Uploaded file has no records');
        }
        setUploading(true);
        await uploadTaxRecords(parsed);
      }

      setCreateForm({
        taxYear: String(new Date().getFullYear()),
        entityName: '',
        taxAmount: '',
        filingStatus: 'pending',
        jurisdiction_id: '',
      });
      setUploadFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tax record');
    } finally {
      setCreating(false);
      setUploading(false);
    }
  }

  function parseCsv(text: string): Partial<TaxRecord>[] {
    function normalizeHeader(header: string): string {
      const key = header.replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[\s_-]+/g, '');
      const aliases: Record<string, string> = {
        taxyear: 'taxYear',
        entityname: 'entityName',
        taxamount: 'taxAmount',
        filingstatus: 'filingStatus',
        entityid: 'entityId',
        totalincome: 'totalIncome',
        taxableincome: 'taxableIncome',
        taxpaid: 'taxPaid',
        outstandingliability: 'outstandingLiability',
        jurisdiction: 'jurisdiction',
        jurisdictionid: 'jurisdiction_id',
        jrid: 'jurisdiction_id',
        filingdate: 'filingDate',
        notes: 'notes',
      };
      return aliases[key] || header.trim();
    }

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV must include header and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => normalizeHeader(h));
    const dataRows = lines.slice(1);
    return dataRows.map((row) => {
      const values = row.split(',').map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] ?? '';
      });
      return {
        ...obj,
        taxYear: obj.taxYear ? Number(obj.taxYear) : undefined,
        taxAmount: obj.taxAmount ? Number(obj.taxAmount) : undefined,
      };
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setUploadFile(file ?? null);
    if (file) setError(null);
  }

  async function handleFilingStatusChange(
    recordId: string,
    filingStatus: NonNullable<TaxRecord['filingStatus']>
  ) {
    setUpdatingStatusId(recordId);
    setError(null);
    try {
      const updated = await updateTaxRecordFilingStatus(recordId, filingStatus);
      setRecords((prev) =>
        prev.map((record) =>
          record._id === recordId ? { ...record, filingStatus: updated.filingStatus } : record
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update filing status');
    } finally {
      setUpdatingStatusId(null);
    }
  }

  return (
    <AppLayout title="Tax Records">
      <h2 className="text-xl font-semibold mb-4">Tax Records</h2>

      <form onSubmit={handleCreateTaxRecord} className="mb-4 bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-5">
          <p className="text-sm font-semibold text-gray-800">
            Either add records manually
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Tax year, entity, amount, filing status, optional jurisdiction from catalog
          </p>
        </div>
        <div>
          <label className={labelClass}>Tax Year *</label>
          <input
            className={`w-full ${inputClass}`}
            placeholder="Tax year"
            value={createForm.taxYear}
            onChange={(e) => setCreateForm({ ...createForm, taxYear: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Entity Name *</label>
          <input
            className={`w-full ${inputClass}`}
            placeholder="Entity name"
            value={createForm.entityName}
            onChange={(e) => setCreateForm({ ...createForm, entityName: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Tax Amount *</label>
          <input
            className={`w-full ${inputClass}`}
            placeholder="Tax amount"
            type="number"
            min="0"
            step="0.01"
            value={createForm.taxAmount}
            onChange={(e) => setCreateForm({ ...createForm, taxAmount: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Filing Status *</label>
          <select
            className={`w-full ${inputClass}`}
            value={createForm.filingStatus}
            onChange={(e) => setCreateForm({ ...createForm, filingStatus: e.target.value })}
          >
            <option value="pending">pending</option>
            <option value="filed">filed</option>
            <option value="amended">amended</option>
            <option value="unfiled">unfiled</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Jurisdiction</label>
          <select
            className={`w-full ${inputClass}`}
            value={createForm.jurisdiction_id}
            onChange={(e) => setCreateForm({ ...createForm, jurisdiction_id: e.target.value })}
          >
            <option value="">None (optional)</option>
            {jurisdictions.map((j) => (
              <option key={j._id} value={j._id}>
                {j.country_code} — {j.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-0.5">Same catalog as Jurisdictions and Rules</p>
        </div>
        <div className="md:col-span-5">
          <p className="text-sm font-semibold text-gray-700">OR</p>
        </div>
        <div className="md:col-span-5">
          <label className={`${labelClass} mb-2`}>Or enter through upload</label>
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileUpload}
            disabled={uploading || creating}
            className={`w-full md:w-auto ${inputClass}`}
          />
          <p className="text-xs text-gray-500 mt-2">
            Upload records (.json or .csv).
          </p>
        </div>
        <div className="md:col-span-5">
          <button
            type="submit"
            disabled={creating || uploading}
            className="w-full md:w-auto text-white rounded px-4 py-2 text-sm font-semibold bg-[#dc6900] hover:bg-[#eb8c00] disabled:opacity-60"
          >
            {creating || uploading ? 'Saving...' : 'Add Records'}
          </button>
        </div>
      </form>

      <TaxRecordsFilters
        filters={filters}
        jurisdictions={jurisdictions}
        onChange={setFilters}
        onApply={handleApply}
        onReset={handleReset}
      />

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-oktawave-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-oktawave-blue font-medium">Loading tax records...</span>
        </div>
      )}

      {!loading && error && (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700 text-sm">{error}</span>
          <button
            onClick={load}
            className="ml-4 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-oktawave-gray">
          <svg className="w-16 h-16 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M9 17H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4M9 17h6"
            />
          </svg>
          <p className="font-semibold text-lg">No tax records found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <>
          <TaxRecordsTable
            records={records}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onFilingStatusChange={handleFilingStatusChange}
            updatingStatusId={updatingStatusId}
          />
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        </>
      )}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/tax-records" replace />} />
            <Route path="/tax-records" element={<TaxRecordsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions/new" element={<NewTransactionPage />} />
            <Route path="/jurisdictions" element={<JurisdictionsPage />} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="/profile" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
