const Organization = require("../models/Organization");
const { createServiceError } = require("../utils/serviceError");

async function createOrganization(data) {
  return Organization.create(data);
}

async function getOrganizationById(orgId) {
  const organization = await Organization.findById(orgId).lean();
  if (!organization) {
    throw createServiceError("Organization not found", 404);
  }
  return organization;
}

async function updateOrganizationById(orgId, data) {
  const organization = await Organization.findByIdAndUpdate(orgId, data, {
    new: true,
    runValidators: true,
  }).lean();
  if (!organization) {
    throw createServiceError("Organization not found", 404);
  }
  return organization;
}

module.exports = {
  createOrganization,
  getOrganizationById,
  updateOrganizationById,
};
