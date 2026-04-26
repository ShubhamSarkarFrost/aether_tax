import type { Jurisdiction } from '../api/jurisdictions';

export interface TaxRecordsFilterState {
  taxYear: string;
  entityName: string;
  filingStatus: string;
  jurisdictionId: string;
}

interface Props {
  filters: TaxRecordsFilterState;
  jurisdictions: Jurisdiction[];
  onChange: (filters: TaxRecordsFilterState) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function TaxRecordsFilters({ filters, jurisdictions, onChange, onApply, onReset }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-oktawave-gray">Entity Name</label>
        <input
          type="text"
          placeholder="Search entity..."
          value={filters.entityName}
          onChange={(e) => onChange({ ...filters, entityName: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-oktawave-blue w-48"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-oktawave-gray">Tax Year</label>
        <input
          type="number"
          placeholder="e.g. 2023"
          value={filters.taxYear}
          onChange={(e) => onChange({ ...filters, taxYear: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-oktawave-blue w-32"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-oktawave-gray">Filing Status</label>
        <select
          value={filters.filingStatus}
          onChange={(e) => onChange({ ...filters, filingStatus: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-oktawave-blue w-36"
        >
          <option value="">All</option>
          <option value="filed">Filed</option>
          <option value="pending">Pending</option>
          <option value="amended">Amended</option>
          <option value="unfiled">Unfiled</option>
        </select>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <label className="text-xs font-medium text-oktawave-gray">Jurisdiction</label>
        <select
          value={filters.jurisdictionId}
          onChange={(e) => onChange({ ...filters, jurisdictionId: e.target.value })}
          className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-oktawave-blue w-56 max-w-full"
        >
          <option value="">All</option>
          {jurisdictions.map((j) => (
            <option key={j._id} value={j._id}>
              {j.country_code} — {j.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onApply}
        className="bg-oktawave-blue text-white px-4 py-2 rounded text-sm font-medium hover:opacity-90 transition"
      >
        Apply Filters
      </button>
      <button
        onClick={onReset}
        className="border border-oktawave-gray text-oktawave-gray px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition"
      >
        Reset
      </button>
    </div>
  );
}
