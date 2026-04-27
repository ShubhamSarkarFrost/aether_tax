import type { TaxExposure, TaxOrchestrationResult } from '../api/exposures';

function computeTaxDue(row: TaxExposure): number {
  const taxCreditsRebates = row.tax_credits_rebates ?? 0;
  const surchargeCess = row.surcharge_cess ?? 0;
  return row.taxable_amount * row.tax_rate - taxCreditsRebates + surchargeCess;
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const principalAmount = exposures[0]?.taxable_amount ?? 0;

  if (variant === 'compact' && exposures.length <= 1) {
    const row = exposures[0];
    if (!row) return null;
    return (
      <div className="text-sm space-y-2">
        <p className="text-xs text-gray-600">
          Jurisdiction <span className="font-semibold text-gray-900">{jurisdiction.country_code}</span>
        </p>
        <div className="flex justify-between">
          <span className="text-gray-500">Principal amount</span>
          <span className="font-medium text-gray-900">
            ${formatCurrency(row.taxable_amount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax</span>
          <span className="font-medium text-gray-900">{row.tax_type} ({(row.tax_rate * 100).toFixed(2)}%)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Credits/Rebates</span>
          <span className="font-medium text-gray-900">${formatCurrency(row.tax_credits_rebates ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Surcharge/Cess</span>
          <span className="font-medium text-gray-900">${formatCurrency(row.surcharge_cess ?? 0)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Tax due</span>
          <span className="font-bold text-gray-900">${formatCurrency(computeTaxDue(row))}</span>
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
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">Principal amount</span>
        <span className="font-medium text-gray-900">
          ${formatCurrency(principalAmount)}
        </span>
      </div>
      <ul className="space-y-2 border border-gray-100 rounded-lg divide-y divide-gray-100">
        {exposures.map((row) => (
          <ExposureRow key={row._id} row={row} />
        ))}
      </ul>
      <div className="flex justify-between text-sm border-t pt-3">
        <span className="font-semibold text-gray-700">Total tax due</span>
        <span className="text-xl font-bold text-gray-900">
          $
          {formatCurrency(summary.total_tax_due)}
        </span>
      </div>
    </div>
  );
}

function ExposureRow({ row }: { row: TaxExposure }) {
  return (
    <li className="p-3 text-sm">
      <div className="flex justify-between text-gray-500">
        <span>Tax</span>
        <span className="font-medium text-gray-900">{row.tax_type} ({(row.tax_rate * 100).toFixed(2)}%)</span>
      </div>
      <div className="flex justify-between text-gray-500 mt-1">
        <span>Credits/Rebates</span>
        <span className="font-medium text-gray-900">${formatCurrency(row.tax_credits_rebates ?? 0)}</span>
      </div>
      <div className="flex justify-between text-gray-500 mt-1">
        <span>Surcharge/Cess</span>
        <span className="font-medium text-gray-900">${formatCurrency(row.surcharge_cess ?? 0)}</span>
      </div>
      <div className="flex justify-between text-gray-500 mt-1">
        <span>Tax due</span>
        <span className="font-semibold text-gray-900">
          ${formatCurrency(computeTaxDue(row))}
        </span>
      </div>
    </li>
  );
}
