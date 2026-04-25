import type { TaxRecord } from '../api/taxRecords';

interface Props {
  records: TaxRecord[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  onFilingStatusChange: (id: string, status: NonNullable<TaxRecord['filingStatus']>) => void;
  updatingStatusId?: string | null;
}

const columns = [
  { key: 'taxYear', label: 'Tax Year' },
  { key: 'entityName', label: 'Entity Name' },
  { key: 'entityId', label: 'Entity ID' },
  { key: 'filingStatus', label: 'Filing Status' },
  { key: 'totalIncome', label: 'Total Income' },
  { key: 'taxableIncome', label: 'Taxable Income' },
  { key: 'taxAmount', label: 'Tax Amount' },
  { key: 'taxPaid', label: 'Tax Paid' },
  { key: 'outstandingLiability', label: 'Outstanding Liability' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'filingDate', label: 'Filing Date' },
];

const currencyColumns = new Set([
  'totalIncome', 'taxableIncome', 'taxAmount', 'taxPaid', 'outstandingLiability',
]);

const statusClasses: Record<string, string> = {
  filed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  amended: 'bg-blue-100 text-blue-800',
  unfiled: 'bg-red-100 text-red-800',
};

function formatCell(key: string, value: unknown): string {
  if (value === undefined || value === null) return '—';
  if (currencyColumns.has(key)) return `$${(value as number).toLocaleString()}`;
  if (key === 'filingDate') return new Date(value as string).toLocaleDateString();
  return String(value);
}

export default function TaxRecordsTable({
  records,
  sortBy,
  sortOrder,
  onSort,
  onFilingStatusChange,
  updatingStatusId,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className="bg-oktawave-blue text-white px-4 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap hover:bg-opacity-90 transition"
              >
                {col.label}
                {sortBy === col.key && (
                  <span className="ml-1">{sortOrder === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-10 text-oktawave-gray">
                No records found
              </td>
            </tr>
          ) : (
            records.map((record, i) => (
              <tr
                key={record._id}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                    {col.key === 'filingStatus' && record.filingStatus ? (
                      <select
                        value={record.filingStatus}
                        onChange={(e) =>
                          onFilingStatusChange(
                            record._id,
                            e.target.value as NonNullable<TaxRecord['filingStatus']>
                          )
                        }
                        disabled={updatingStatusId === record._id}
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          statusClasses[record.filingStatus] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="pending">pending</option>
                        <option value="filed">filed</option>
                        <option value="amended">amended</option>
                        <option value="unfiled">unfiled</option>
                      </select>
                    ) : (
                      formatCell(col.key, record[col.key as keyof TaxRecord])
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
