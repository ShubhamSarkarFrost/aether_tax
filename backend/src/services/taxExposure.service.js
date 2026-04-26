const TaxExposure = require("../models/TaxExposure");
const { runOrchestration } = require("./taxOrchestrator.service");
const { createServiceError } = require("../utils/serviceError");

/**
 * Full multi-rule run (GST/VAT/OECD lanes, etc.); prefer this for new code.
 */
async function calculateTaxExposuresViaOrchestrator(transactionId, orgId, options) {
  return runOrchestration(transactionId, orgId, options);
}

/**
 * @deprecated For backward compatibility: returns the first created exposure. Prefer calculateTaxExposuresViaOrchestrator or runOrchestration for the full set.
 */
async function calculateTaxExposure(transactionId, orgId) {
  const result = await runOrchestration(transactionId, orgId);
  if (!result.exposures.length) {
    throw createServiceError("Orchestration produced no exposures", 500);
  }
  return result.exposures[0];
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
  calculateTaxExposuresViaOrchestrator,
  listTaxExposures,
  getTaxExposureById,
  listTaxExposuresByTransaction,
};
