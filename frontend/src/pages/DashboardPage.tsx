import { useState, useEffect } from 'react';
import { Activity, DollarSign, Globe, TrendingUp } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import MetricCard from '../components/MetricCard';
import JurisdictionTable from '../components/JurisdictionTable';
import RecentTransactionsTable from '../components/RecentTransactionsTable';
import { fetchDashboardSummary, DashboardSummary } from '../api/dashboard';
import { fetchTransactions, Transaction } from '../api/transactions';
import { fetchAllExposures } from '../api/exposures';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, txResult] = await Promise.all([
        fetchDashboardSummary(),
        fetchTransactions({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        fetchAllExposures(),
      ]);
      setSummary(summaryData);
      setTransactions(txResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Executive Exposure Dashboard">
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#dc6900', borderTopColor: 'transparent' }}
          />
          <span className="text-sm font-medium" style={{ color: '#dc6900' }}>
            Loading dashboard...
          </span>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={load}
            className="ml-4 text-white px-3 py-1.5 rounded text-sm font-medium transition"
            style={{ backgroundColor: '#e0301e' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && summary && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Transactions"
              value={summary.total_transactions.toLocaleString()}
              icon={<Activity size={20} />}
              accentColor="#dc6900"
            />
            <MetricCard
              title="Total Tax Exposure"
              value={`$${summary.total_exposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle="Calculated across all jurisdictions"
              icon={<DollarSign size={20} />}
              accentColor="#dc6900"
            />
            <MetricCard
              title="Cross-Border Transactions"
              value={summary.cross_border_count.toLocaleString()}
              icon={<Globe size={20} />}
              accentColor="#eb8c00"
            />
            <MetricCard
              title="Avg Confidence Score"
              value={`${(summary.avg_confidence_score * 100).toFixed(1)}%`}
              subtitle={`${summary.classified_count} classified · ${summary.pending_count} pending`}
              icon={<TrendingUp size={20} />}
              accentColor="#e0301e"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Jurisdiction Exposure Distribution
            </h3>
            <JurisdictionTable data={summary.jurisdiction_breakdown} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <RecentTransactionsTable transactions={transactions} />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
