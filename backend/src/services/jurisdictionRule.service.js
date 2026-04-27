const JurisdictionRule = require("../models/JurisdictionRule");
const { createServiceError } = require("../utils/serviceError");

function validateStandardRate(rate, isRequired) {
  if (rate === undefined || rate === null) {
    if (isRequired) {
      throw createServiceError("standard_rate is required", 400);
    }
    return;
  }

  if (typeof rate !== "number" || Number.isNaN(rate)) {
    throw createServiceError("standard_rate must be a number", 400);
  }

  if (rate < 0 || rate > 1) {
    throw createServiceError("standard_rate must be between 0 and 1 (decimal format, e.g. 0.18)", 400);
  }
}

async function createJurisdictionRule(data) {
  validateStandardRate(data.standard_rate, true);
  return JurisdictionRule.create(data);
}

async function listJurisdictionRules() {
  return JurisdictionRule.find().sort({ createdAt: -1 }).lean();
}

async function getJurisdictionRuleById(id) {
  const rule = await JurisdictionRule.findById(id).lean();
  if (!rule) {
    throw createServiceError("Jurisdictional rule not found", 404);
  }
  return rule;
}

async function updateJurisdictionRuleById(id, data) {
  validateStandardRate(data.standard_rate, false);
  const rule = await JurisdictionRule.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!rule) {
    throw createServiceError("Jurisdictional rule not found", 404);
  }
  return rule;
}

module.exports = {
  createJurisdictionRule,
  listJurisdictionRules,
  getJurisdictionRuleById,
  updateJurisdictionRuleById,
};
