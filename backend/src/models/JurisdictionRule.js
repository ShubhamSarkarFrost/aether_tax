const mongoose = require("mongoose");

const jurisdictionRuleSchema = new mongoose.Schema(
  {
    jurisdiction_id: { type: mongoose.Schema.Types.ObjectId, ref: "Jurisdiction", required: true },
    rule_type: { type: String, required: true, trim: true },
    tax_category: { type: String, required: true, trim: true },
    standard_rate: {
      type: Number,
      required: true,
      min: [0, "standard_rate must be between 0 and 1 (decimal format, e.g. 0.18)"],
      max: [1, "standard_rate must be between 0 and 1 (decimal format, e.g. 0.18)"],
    },
    rule_logic: { type: String, trim: true },
    valid_from: { type: Date, required: true },
    valid_to: { type: Date },
    /** When set, only these transaction_type values (see Transaction model) get this rule; when empty, all types match. */
    applies_to_transaction_types: [{ type: String, trim: true }],
    source_reference: { type: String, trim: true },
    oecd_framework_tag: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JurisdictionRule", jurisdictionRuleSchema);
