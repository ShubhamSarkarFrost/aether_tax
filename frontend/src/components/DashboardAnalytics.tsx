import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardSummary } from '../api/dashboard';

const COLORS = ['#dc6900', '#eb8c00', '#e0301e', '#1a1a2e', '#2d2d44', '#6b7280', '#9ca3af'];
const AETHER_ORANGE = '#dc6900';

type Props = {
  summary: DashboardSummary;
};

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function DashboardAnalytics({ summary }: Props) {
  const exposureByJurisdiction = useMemo(() => {
    const rows = summary.jurisdiction_labeled || [];
    if (rows.length > 0) {
      return rows.map((j) => ({
        name: j.country_code || String(j.jurisdiction_id).slice(-6) || '—',
        fullLabel: j.name || j.country_code || 'Jurisdiction',
        tax_due: j.tax_due,
        count: j.count,
      }));
    }
    return (summary.jurisdiction_breakdown || []).map((j) => ({
      name: String(j.jurisdiction_id).slice(-8),
      fullLabel: 'Jurisdiction',
      tax_due: j.tax_due,
      count: j.count,
    }));
  }, [summary.jurisdiction_labeled, summary.jurisdiction_breakdown]);

  const taxTypeData = useMemo(
    () =>
      (summary.exposure_by_tax_type || []).map((r) => ({
        name: r.tax_type,
        value: r.tax_due,
        count: r.count,
      })),
    [summary.exposure_by_tax_type]
  );

  const filingData = useMemo(
    () =>
      (Object.entries(summary.filing_status_counts || {}) as [string, number][])
        .filter(([k]) => k !== 'unknown')
        .map(([name, value]) => ({ name, value })),
    [summary.filing_status_counts]
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Tax exposure by jurisdiction</h3>
          <p className="text-xs text-gray-500 mb-4">From your org&apos;s recorded exposures (simulated / calculated).</p>
          {exposureByJurisdiction.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No exposure data to chart yet.</p>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exposureByJurisdiction} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${formatMoney(v)}`}
                    width={64}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value ?? 0).toFixed(2)}`,
                      'Tax due',
                    ]}
                    labelFormatter={(_, p) => {
                      const p0 = p?.[0]?.payload as { fullLabel?: string; name?: string } | undefined;
                      return p0?.fullLabel || p0?.name || '';
                    }}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="tax_due" name="Tax due" fill={AETHER_ORANGE} radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Exposure by tax category</h3>
          <p className="text-xs text-gray-500 mb-4">Split by `tax_type` in your system.</p>
          {taxTypeData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No tax-type breakdown yet.</p>
          ) : (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taxTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                    label={({ name, percent }) =>
                      `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {taxTypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `$${Number(v ?? 0).toFixed(2)}`}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {filingData.some((d) => d.value > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Filing status (records)</h3>
          <div className="h-[260px] w-full min-w-0 max-w-md mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filingData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  label
                >
                  {filingData.map((_, i) => (
                    <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
