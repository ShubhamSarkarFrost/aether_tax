import { Transaction } from '../api/transactions';

interface Props {
  transactions: Transaction[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  classified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function RecentTransactionsTable({ transactions }: Props) {
  const recent = transactions.slice(0, 10);

  if (recent.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 text-sm">No transactions available.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {['Type', 'Amount', 'Currency', 'Origin', 'Destination', 'Cross-Border', 'Status'].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-semibold text-white whitespace-nowrap"
                  style={{ backgroundColor: '#602320' }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {recent.map((tx, i) => (
            <tr key={tx._id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 capitalize text-gray-900">{tx.transaction_type}</td>
              <td className="px-4 py-3 text-gray-700">
                {tx.currency} {tx.amount.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-gray-700">{tx.currency}</td>
              <td className="px-4 py-3 text-gray-700">{tx.originating_country}</td>
              <td className="px-4 py-3 text-gray-700">{tx.destination_country}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    tx.cross_border ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tx.cross_border ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusStyles[tx.classification_status] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tx.classification_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
