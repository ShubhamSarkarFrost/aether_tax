const Transaction = require("../models/Transaction");
const Jurisdiction = require("../models/Jurisdiction");
const JurisdictionRule = require("../models/JurisdictionRule");
const TaxExposure = require("../models/TaxExposure");
const { createServiceError } = require("../utils/serviceError");

/**
 * @typedef {Object} OrchestrationOptions
 * @property {Date} [asOf] - Effective date for rule resolution (for simulations / backdating).
 * @property {boolean} [replaceExisting] - When true, remove prior exposures for this transaction before writing (default: true for live runs).
 */

/**
 * Resolve all active rules for a jurisdiction as of a given date.
 * @param {import("mongoose").Types.ObjectId} jurisdictionId
 * @param {Date} asOf
 */
async function findActiveRulesForJurisdiction(jurisdictionId, asOf) {
  return JurisdictionRule.find({
    jurisdiction_id: jurisdictionId,
    active: true,
    valid_from: { $lte: asOf },
    $or: [{ valid_to: null }, { valid_to: { $gt: asOf } }],
  })
    .sort({ valid_from: -1, tax_category: 1, rule_type: 1 })
    .lean();
}

/**
 * @param {import("mongoose").Document} transaction
 * @param {object} rule - lean JurisdictionRule
 */
function ruleAppliesToTransaction(transaction, rule) {
  if (Array.isArray(rule.applies_to_transaction_types) && rule.applies_to_transaction_types.length > 0) {
    return rule.applies_to_transaction_types.includes(transaction.transaction_type);
  }
  return true;
}

/**
 * @param {import("mongoose").Document} transaction
 * @param {object} jurisdiction - lean
 * @param {object} rule - lean JurisdictionRule
 * @param {Date} asOf
 */
function computeLineItem(transaction, jurisdiction, rule, asOf) {
  const taxable_amount = transaction.amount;
  const tax_rate = rule.standard_rate;
  const tax_credits_rebates = transaction.tax_credits_rebates || 0;
  const surcharge_cess = transaction.surcharge_cess || 0;
  const gross_tax = taxable_amount * tax_rate;
  const tax_due = gross_tax - tax_credits_rebates + surcharge_cess;
  const basis = rule.rule_logic
    ? `gross_tax=${taxable_amount}*${tax_rate}; tax_due=(gross_tax-${tax_credits_rebates})+${surcharge_cess}; basis=${rule.rule_logic}; asOf=${asOf.toISOString()}`
    : `tax_due = (taxable_amount * tax_rate) - tax_credits_rebates + surcharge_cess; asOf=${asOf.toISOString()}`;

  return {
    transaction_id: transaction._id,
    org_id: transaction.org_id,
    jurisdiction_id: jurisdiction._id,
    rule_id: rule._id,
    tax_type: rule.tax_category,
    taxable_amount,
    tax_rate,
    gross_tax,
    tax_credits_rebates,
    surcharge_cess,
    tax_due,
    calculation_basis: basis,
    confidence_score: ruleAppliesToTransaction(transaction, rule) ? 0.9 : 0.55,
    calculated_at: new Date(),
  };
}

/**
 * Single entry point: map a transaction to one or more tax exposures (multi-lane: GST, VAT, WHT, OECD-tagged rules, etc.).
 * @param {string} transactionId
 * @param {string|undefined} orgId
 * @param {OrchestrationOptions} [options]
 * @returns {Promise<{ transaction_id: string, jurisdiction: { _id: string, country_code: string }, exposures: object[], summary: { total_tax_due: number, rule_count: number, as_of: string } }>}
 */
async function runOrchestration(transactionId, orgId, options = {}) {
  const asOf = options.asOf instanceof Date ? options.asOf : new Date();
  const replaceExisting = options.replaceExisting !== false;

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw createServiceError("Transaction not found", 404);
  }
  if (orgId && transaction.org_id !== orgId) {
    throw createServiceError("Access denied", 403);
  }

  const jurisdiction = await Jurisdiction.findOne({
    country_code: transaction.destination_country,
    active: true,
  }).lean();
  if (!jurisdiction) {
    throw createServiceError(`No active jurisdiction found for country ${transaction.destination_country}`, 422);
  }

  const allRules = await findActiveRulesForJurisdiction(jurisdiction._id, asOf);
  const rules = allRules.filter((r) => ruleAppliesToTransaction(transaction, r));

  if (rules.length === 0) {
    throw createServiceError(
      `No active jurisdictional rules for ${jurisdiction.country_code} as of ${asOf.toISOString()}`,
      422
    );
  }

  if (replaceExisting) {
    await TaxExposure.deleteMany({ transaction_id: transaction._id, org_id: transaction.org_id });
  }

  const lineDocs = rules.map((rule) => computeLineItem(transaction, jurisdiction, rule, asOf));
  const created = await TaxExposure.insertMany(lineDocs);

  const total_tax_due = created.reduce((sum, e) => sum + e.tax_due, 0);

  return {
    transaction_id: String(transaction._id),
    jurisdiction: {
      _id: String(jurisdiction._id),
      country_code: jurisdiction.country_code,
    },
    exposures: created.map((d) => d.toObject ? d.toObject() : d),
    summary: {
      total_tax_due,
      rule_count: created.length,
      as_of: asOf.toISOString(),
    },
  };
}

module.exports = {
  runOrchestration,
  findActiveRulesForJurisdiction,
  ruleAppliesToTransaction,
  computeLineItem,
};
