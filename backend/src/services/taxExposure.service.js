const Transaction = require("../models/Transaction");
const Jurisdiction = require("../models/Jurisdiction");
const JurisdictionRule = require("../models/JurisdictionRule");
const TaxExposure = require("../models/TaxExposure");
const { createServiceError } = require("../utils/serviceError");

async function calculateTaxExposure(transactionId, orgId) {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw createServiceError("Transaction not found", 404);
  }

  if (orgId && transaction.org_id !== orgId) {
    throw createServiceError("Access denied", 403);
  }

  const jurisdiction = await Jurisdiction.findOne({ country_code: transaction.destination_country, active: true }).lean();
  if (!jurisdiction) {
    throw createServiceError(`No active jurisdiction found for country ${transaction.destination_country}`, 422);
  }

  const now = new Date();
  const rule = await JurisdictionRule.findOne({
    jurisdiction_id: jurisdiction._id,
    active: true,
    valid_from: { $lte: now },
    $or: [{ valid_to: null }, { valid_to: { $gt: now } }],
  }).sort({ valid_from: -1 });

  if (!rule) {
    throw createServiceError(`No active jurisdictional rule found for ${jurisdiction.country_code}`, 422);
  }

  const taxable_amount = transaction.amount;
  const tax_rate = rule.standard_rate;
  const tax_due = taxable_amount * tax_rate;

  const exposure = await TaxExposure.create({
    transaction_id: transaction._id,
    org_id: transaction.org_id,
    jurisdiction_id: jurisdiction._id,
    rule_id: rule._id,
    tax_type: rule.tax_category,
    taxable_amount,
    tax_rate,
    tax_due,
    calculation_basis: "tax_due = taxable_amount * tax_rate",
    confidence_score: 0.9,
    calculated_at: new Date(),
  });

  return exposure;
}

async function listTaxExposures(orgId) {
  return TaxExposure.find(orgId ? { org_id: orgId } : {}).sort({ calculated_at: -1 }).lean();
}

async function getTaxExposureById(id, orgId) {
  const exposure = await TaxExposure.findById(id).lean();
  if (!exposure) {
    throw createServiceError("Tax exposure not found", 404);
  }
  if (orgId && exposure.org_id !== orgId) {
    throw createServiceError("Access denied", 403);
  }
  return exposure;
}

async function listTaxExposuresByTransaction(transactionId, orgId) {
  const exposures = await TaxExposure.find({ transaction_id: transactionId }).sort({ calculated_at: -1 }).lean();
  return orgId ? exposures.filter((item) => item.org_id === orgId) : exposures;
}

module.exports = {
  calculateTaxExposure,
  listTaxExposures,
  getTaxExposureById,
  listTaxExposuresByTransaction,
};
