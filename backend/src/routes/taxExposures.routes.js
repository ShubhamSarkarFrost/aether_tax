const express = require("express");
const {
  calculateTaxExposure,
  listTaxExposures,
  getTaxExposureById,
  listTaxExposuresByTransaction,
} = require("../services/taxExposure.service");
const { getOrgIdFromRequest } = require("../utils/orgContext");

const router = express.Router();

router.post("/tax-exposures/calculate/:transactionId", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const exposure = await calculateTaxExposure(req.params.transactionId, orgId);
    return res.status(201).json({ success: true, data: exposure });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// Backward compatible endpoint for current frontend calls.
router.post("/exposures/calculate/:transactionId", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const exposure = await calculateTaxExposure(req.params.transactionId, orgId);
    return res.status(201).json({ success: true, data: exposure });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/tax-exposures", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const exposures = await listTaxExposures(orgId);
    return res.json({ success: true, data: exposures });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/tax-exposures/:id", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const exposure = await getTaxExposureById(req.params.id, orgId);
    return res.json({ success: true, data: exposure });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/transactions/:transactionId/exposures", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const filtered = await listTaxExposuresByTransaction(req.params.transactionId, orgId);
    return res.json({ success: true, data: filtered });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// Backward compatible endpoint for current frontend calls.
router.get("/exposures/transaction/:transactionId", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const filtered = await listTaxExposuresByTransaction(req.params.transactionId, orgId);
    return res.json({ success: true, data: filtered });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// Backward compatible endpoint for current frontend calls.
router.get("/exposures", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const exposures = await listTaxExposures(orgId);
    return res.json({ success: true, data: exposures });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = router;
