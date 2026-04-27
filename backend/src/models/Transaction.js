const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    org_id: { type: String, required: true },
    source_system: { type: String, default: "manual" },
    transaction_type: {
      type: String,
      enum: ["sale", "purchase", "service", "royalty", "dividend", "interest"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    tax_credits_rebates: { type: Number, default: 0, min: 0 },
    surcharge_cess: { type: Number, default: 0, min: 0 },
    currency: { type: String, required: true, default: "USD" },
    originating_country: { type: String, required: true, minlength: 2, maxlength: 2 },
    destination_country: { type: String, required: true, minlength: 2, maxlength: 2 },
    is_intercompany: { type: Boolean, default: false },
    is_cross_border: { type: Boolean },
    cross_border: { type: Boolean },
    classification_status: {
      type: String,
      enum: ["pending", "classified", "rejected"],
      default: "pending",
    },
    transaction_date: { type: Date, default: Date.now },
    classified_at: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

transactionSchema.pre("save", function () {
  const isCrossBorder = this.originating_country !== this.destination_country;
  this.is_cross_border = isCrossBorder;
  this.cross_border = isCrossBorder;
});

module.exports = mongoose.model("Transaction", transactionSchema);
