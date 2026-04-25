const JurisdictionRule = require("../models/JurisdictionRule");
const { createServiceError } = require("../utils/serviceError");

async function createJurisdictionRule(data) {
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
