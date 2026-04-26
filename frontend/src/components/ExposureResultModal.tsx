import { X } from 'lucide-react';
import type { TaxExposure, TaxOrchestrationResult } from '../api/exposures';
import TaxOrchestrator from './TaxOrchestrator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  /** Primary / first line (optional if orchestration provides rows). */
  exposure: TaxExposure | null;
  /** Full tax orchestrator run: multiple rules (e.g. GST + WHT) and totals. */
  orchestration?: TaxOrchestrationResult | null;
  onRetry: () => void;
}

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

export default function ExposureResultModal({
  isOpen,
  onClose,
  loading,
  error,
  exposure,
  orchestration,
  onRetry,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tax Orchestrator Result</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#dc6900', borderTopColor: 'transparent' }}
            />
            <p className="text-sm font-medium" style={{ color: '#dc6900' }}>
              Calculating exposure...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={onRetry}
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: '#e0301e' }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && orchestration && (
          <div className="space-y-3">
            <TaxOrchestrator orchestration={orchestration} />
            <button
              onClick={onClose}
              className="w-full mt-4 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: '#dc6900' }}
            >
              Close
            </button>
          </div>
        )}

        {!loading && !error && !orchestration && exposure && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Jurisdiction</span>
              <span className="font-medium text-gray-900">{exposure.jurisdiction_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax Type</span>
              <span className="font-medium text-gray-900">{exposure.tax_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxable Amount</span>
              <span className="font-medium text-gray-900">
                ${exposure.taxable_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax Rate</span>
              <span className="font-medium text-gray-900">
                {(exposure.tax_rate * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="font-semibold text-gray-700">Tax Due</span>
              <span className="text-xl font-bold text-gray-900">
                $
                {exposure.tax_due.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-500">Confidence Score</span>
              <ConfidenceBadge score={exposure.confidence_score} />
            </div>
            <button
              onClick={onClose}
              className="w-full mt-4 py-2 rounded-lg text-sm font-medium text-white transition"
              style={{ backgroundColor: '#dc6900' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
