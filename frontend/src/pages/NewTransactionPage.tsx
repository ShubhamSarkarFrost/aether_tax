import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import ExposureResultModal from '../components/ExposureResultModal';
import { createTransaction } from '../api/transactions';
import { calculateExposure } from '../api/exposures';
import type { TaxExposure } from '../api/exposures';

const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SG', name: 'Singapore' },
  { code: 'US', name: 'United States' },
  { code: 'ZA', name: 'South Africa' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'SGD'];

interface FormData {
  transaction_type: string;
  amount: string;
  currency: string;
  originating_country: string;
  destination_country: string;
  is_intercompany: boolean;
  notes: string;
}

interface FormErrors {
  transaction_type?: string;
  amount?: string;
  currency?: string;
  originating_country?: string;
  destination_country?: string;
}

const DEFAULT_FORM: FormData = {
  transaction_type: '',
  amount: '',
  currency: 'USD',
  originating_country: '',
  destination_country: '',
  is_intercompany: false,
  notes: '',
};

export default function NewTransactionPage() {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [exposure, setExposure] = useState<TaxExposure | null>(null);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.transaction_type) errs.transaction_type = 'Transaction type is required';
    if (form.amount === '' || Number(form.amount) < 0) errs.amount = 'Amount must be 0 or greater';
    if (!form.currency) errs.currency = 'Currency is required';
    if (!form.originating_country) errs.originating_country = 'Originating country is required';
    if (!form.destination_country) errs.destination_country = 'Destination country is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function runCalculation(transactionId: string) {
    setModalLoading(true);
    setModalError(null);
    try {
      const result = await calculateExposure(transactionId);
      setExposure(result);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Exposure calculation failed');
    } finally {
      setModalLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSuccessMessage(null);
    try {
      const tx = await createTransaction({
        transaction_type: form.transaction_type,
        amount: Number(form.amount),
        currency: form.currency,
        originating_country: form.originating_country,
        destination_country: form.destination_country,
        is_intercompany: form.is_intercompany,
        notes: form.notes || undefined,
      });

      setSuccessMessage('Transaction submitted successfully!');
      setForm(DEFAULT_FORM);
      setErrors({});

      setPendingTransactionId(tx._id);
      setExposure(null);
      setModalOpen(true);
      runCalculation(tx._id);
    } catch (err) {
      setErrors({ transaction_type: err instanceof Error ? err.message : 'Submission failed' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    if (pendingTransactionId) {
      runCalculation(pendingTransactionId);
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc6900]';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const errorClass = 'text-xs text-red-600 mt-1';

  return (
    <AppLayout title="New Transaction">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Transaction Details</h2>

          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className={labelClass}>Transaction Type *</label>
              <select
                value={form.transaction_type}
                onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
                className={inputClass}
              >
                <option value="">Select type...</option>
                {['sale', 'purchase', 'service', 'royalty', 'dividend', 'interest'].map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              {errors.transaction_type && <p className={errorClass}>{errors.transaction_type}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Amount *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={inputClass}
                />
                {errors.amount && <p className={errorClass}>{errors.amount}</p>}
              </div>

              <div>
                <label className={labelClass}>Currency *</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className={inputClass}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.currency && <p className={errorClass}>{errors.currency}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Originating Country *</label>
                <select
                  value={form.originating_country}
                  onChange={(e) => setForm({ ...form, originating_country: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} – {c.name}
                    </option>
                  ))}
                </select>
                {errors.originating_country && (
                  <p className={errorClass}>{errors.originating_country}</p>
                )}
              </div>

              <div>
                <label className={labelClass}>Destination Country *</label>
                <select
                  value={form.destination_country}
                  onChange={(e) => setForm({ ...form, destination_country: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} – {c.name}
                    </option>
                  ))}
                </select>
                {errors.destination_country && (
                  <p className={errorClass}>{errors.destination_country}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_intercompany"
                checked={form.is_intercompany}
                onChange={(e) => setForm({ ...form, is_intercompany: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 accent-[#dc6900]"
              />
              <label htmlFor="is_intercompany" className="text-sm font-medium text-gray-700">
                Intercompany Transaction
              </label>
            </div>

            <div>
              <label className={labelClass}>Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="Add any additional notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#dc6900' }}
              onMouseEnter={(e) =>
                !submitting && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#eb8c00')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc6900')
              }
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Transaction'
              )}
            </button>
          </form>
        </div>
      </div>

      <ExposureResultModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        loading={modalLoading}
        error={modalError}
        exposure={exposure}
        onRetry={handleRetry}
      />
    </AppLayout>
  );
}
