import RiskBadge from './RiskBadge';

interface JurisdictionRow {
  jurisdiction_id: string;
  tax_due: number;
  count: number;
  country_code?: string;
  name?: string;
}

interface Props {
  data: JurisdictionRow[];
}

export default function JurisdictionTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">No jurisdiction data available.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {['Jurisdiction', 'Transactions', 'Total Tax Due', 'Risk Level'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-semibold text-white whitespace-nowrap"
                style={{ backgroundColor: '#dc6900' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.jurisdiction_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 font-medium text-gray-900">
                {row.country_code ? (
                  <span>
                    <span className="font-semibold">{row.country_code}</span>
                    {row.name && <span className="text-gray-500 font-normal"> · {row.name}</span>}
                  </span>
                ) : (
                  row.jurisdiction_id
                )}
              </td>
              <td className="px-4 py-3 text-gray-700">{row.count}</td>
              <td className="px-4 py-3 text-gray-700">
                ${row.tax_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3">
                <RiskBadge taxDue={row.tax_due} confidenceScore={0.8} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
