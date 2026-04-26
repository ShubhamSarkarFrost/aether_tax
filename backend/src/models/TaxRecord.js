const mongoose = require('mongoose');

const taxRecordSchema = new mongoose.Schema(
  {
    taxYear: { type: Number, required: true },
    entityName: { type: String, required: true },
    entityId: { type: String },
    /** Catalog link — same Jurisdiction collection as rules and transactions. */
    jurisdiction_id: { type: mongoose.Schema.Types.ObjectId, ref: "Jurisdiction" },
    filingStatus: {
      type: String,
      enum: ['filed', 'pending', 'amended', 'unfiled'],
      default: 'pending',
    },
    totalIncome: { type: Number },
    taxableIncome: { type: Number },
    taxAmount: { type: Number, required: true },
    taxPaid: { type: Number },
    outstandingLiability: { type: Number },
    /** Free text / legacy; when jurisdiction_id is set, API may set this to "CC — Name" for search and exports. */
    jurisdiction: { type: String },
    filingDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaxRecord', taxRecordSchema);
