const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    org_id: { type: String, required: true },
    transaction_type: {
      type: String,
      enum: ['sale', 'purchase', 'service', 'royalty', 'dividend', 'interest'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    originating_country: { type: String, required: true, minlength: 2, maxlength: 2 },
    destination_country: { type: String, required: true, minlength: 2, maxlength: 2 },
    is_intercompany: { type: Boolean, default: false },
    cross_border: { type: Boolean },
    classification_status: {
      type: String,
      enum: ['pending', 'classified', 'rejected'],
      default: 'pending',
    },
    classified_at: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

transactionSchema.pre('save', function (next) {
  this.cross_border = this.originating_country !== this.destination_country;
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
