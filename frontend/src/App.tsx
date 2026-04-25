import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { fetchTaxRecords, TaxRecord, PaginationMeta } from './api/taxRecords';
import TaxRecordsFilters from './components/TaxRecordsFilters';
import TaxRecordsTable from './components/TaxRecordsTable';
import Pagination from './components/Pagination';
import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import NewTransactionPage from './pages/NewTransactionPage';

interface Filters {
  taxYear: string;
  entityName: string;
  filingStatus: string;
  jurisdiction: string;
}

const DEFAULT_FILTERS: Filters = {
  taxYear: '',
  entityName: '',
  filingStatus: '',
  jurisdiction: '',
};

function TaxRecordsPage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(DEFAULT_FILTERS);
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
        jurisdiction: appliedFilters.jurisdiction || undefined,
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

  return (
    <AppLayout title="Tax Records">
      <h2 className="text-xl font-semibold mb-4">Tax Records</h2>

      <TaxRecordsFilters
        filters={filters}
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TaxRecordsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions/new" element={<NewTransactionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
