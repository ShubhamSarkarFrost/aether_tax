const mongoose = require("mongoose");

const jurisdictionSchema = new mongoose.Schema(
  {
    country_code: { type: String, required: true, uppercase: true, minlength: 2, maxlength: 2 },
    region_code: { type: String, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    currency: { type: String, required: true, uppercase: true },
    tax_authority_name: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Jurisdiction", jurisdictionSchema);
