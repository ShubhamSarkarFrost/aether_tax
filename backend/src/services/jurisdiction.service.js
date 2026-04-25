const Jurisdiction = require("../models/Jurisdiction");
const { createServiceError } = require("../utils/serviceError");

function normalizePayload(data) {
  return {
    ...data,
    country_code: data.country_code?.toUpperCase(),
    region_code: data.region_code?.toUpperCase(),
    currency: data.currency?.toUpperCase(),
  };
}

async function createJurisdiction(data) {
  return Jurisdiction.create(normalizePayload(data));
}

async function listJurisdictions() {
  return Jurisdiction.find().sort({ name: 1 }).lean();
}

async function getJurisdictionById(id) {
  const jurisdiction = await Jurisdiction.findById(id).lean();
  if (!jurisdiction) {
    throw createServiceError("Jurisdiction not found", 404);
  }
  return jurisdiction;
}

async function updateJurisdictionById(id, data) {
  const jurisdiction = await Jurisdiction.findByIdAndUpdate(id, normalizePayload(data), {
    new: true,
    runValidators: true,
  }).lean();
  if (!jurisdiction) {
    throw createServiceError("Jurisdiction not found", 404);
  }
  return jurisdiction;
}

module.exports = {
  createJurisdiction,
  listJurisdictions,
  getJurisdictionById,
  updateJurisdictionById,
};
