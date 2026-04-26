import type { TaxExposure, TaxOrchestrationResult } from '../api/exposures';

function ConfidenceBadge({ score }: { score: number }) {
  const cls =
    score >= 0.8
      ? 'bg-green-100 text-green-700'
      : score >= 0.5
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {(score * 100).toFixed(0)}%
    </span>
  );
}

type Props = {
  orchestration: TaxOrchestrationResult;
  /** When only one line exists, you may still want compact layout. */
  variant?: 'list' | 'compact';
};

/**
 * Renders a multi-rule tax run (e.g. GST + VAT + OECD-tagged rules) with per-line and total due.
 */
export default function TaxOrchestrator({ orchestration, variant = 'list' }: Props) {
  const { jurisdiction, summary, exposures } = orchestration;

  if (variant === 'compact' && exposures.length <= 1) {
    const row = exposures[0];
    if (!row) return null;
    return (
      <div className="text-sm space-y-2">
        <p className="text-xs text-gray-600">
          Jurisdiction <span className="font-semibold text-gray-900">{jurisdiction.country_code}</span>
        </p>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax type</span>
          <span className="font-medium text-gray-900">{row.tax_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax due</span>
          <span className="font-bold text-gray-900">
            $
            {row.tax_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-end">
          <ConfidenceBadge score={row.confidence_score} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600">
        Jurisdiction: <span className="font-semibold text-gray-900">{jurisdiction.country_code}</span>
        {summary.rule_count > 1 && (
          <span className="text-gray-500"> · {summary.rule_count} rules applied</span>
        )}
      </p>
      <ul className="space-y-2 border border-gray-100 rounded-lg divide-y divide-gray-100">
        {exposures.map((row) => (
          <ExposureRow key={row._id} row={row} />
        ))}
      </ul>
      <div className="flex justify-between text-sm border-t pt-3">
        <span className="font-semibold text-gray-700">Total tax due</span>
        <span className="text-xl font-bold text-gray-900">
          $
          {summary.total_tax_due.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}

function ExposureRow({ row }: { row: TaxExposure }) {
  return (
    <li className="p-3 text-sm">
      <div className="flex justify-between font-medium text-gray-900">
        <span>{row.tax_type}</span>
        <span>
          ${row.tax_due.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="flex justify-between text-gray-500 text-xs mt-1">
        <span>Rate {(row.tax_rate * 100).toFixed(2)}%</span>
        <ConfidenceBadge score={row.confidence_score} />
      </div>
    </li>
  );
}
