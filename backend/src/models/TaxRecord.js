const mongoose = require('mongoose');

const taxRecordSchema = new mongoose.Schema(
  {
    taxYear: { type: Number, required: true },
    entityName: { type: String, required: true },
    entityId: { type: String },
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
    jurisdiction: { type: String },
    filingDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TaxRecord', taxRecordSchema);
