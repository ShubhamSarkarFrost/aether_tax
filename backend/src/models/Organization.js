const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    legal_name: { type: String, required: true, trim: true },
    entity_type: { type: String, required: true, trim: true },
    country_of_incorporation: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
    tax_identification_number: { type: String, trim: true },
    org_tier: { type: String, enum: ["starter", "growth", "enterprise"], default: "starter" },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
