const mongoose = require('mongoose');

const jurisdictionRuleSchema = new mongoose.Schema(
  {
    jurisdiction_id: { type: String, required: true },
    country_code: { type: String, required: true, minlength: 2, maxlength: 2 },
    transaction_type: { type: String, required: true },
    tax_type: {
      type: String,
      enum: ['VAT', 'GST', 'corporate_tax', 'WHT'],
      required: true,
    },
    tax_rate: { type: Number, required: true, min: 0, max: 1 },
    effective_from: { type: Date, required: true },
    effective_to: { type: Date },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JurisdictionRule', jurisdictionRuleSchema);
