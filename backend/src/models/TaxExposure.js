const mongoose = require('mongoose');

const taxExposureSchema = new mongoose.Schema(
  {
    transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    org_id: { type: String, required: true },
    jurisdiction_id: { type: String, required: true },
    rule_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JurisdictionRule', required: true },
    tax_type: { type: String, required: true },
    taxable_amount: { type: Number, required: true },
    tax_rate: { type: Number, required: true },
    tax_due: { type: Number, required: true },
    confidence_score: { type: Number, min: 0, max: 1 },
    calculated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaxExposure', taxExposureSchema);
