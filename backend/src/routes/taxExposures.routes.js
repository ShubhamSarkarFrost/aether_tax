const express = require("express");
const {
  listTaxExposures,
  getTaxExposureById,
  listTaxExposuresByTransaction,
} = require("../services/taxExposure.service");
const { runOrchestration } = require("../services/taxOrchestrator.service");
const { getOrgIdFromRequest } = require("../utils/orgContext");

const router = express.Router();

router.post("/tax-exposures/calculate/:transactionId", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const asOf = req.body?.asOf ? new Date(req.body.asOf) : undefined;
    const result = await runOrchestration(req.params.transactionId, orgId, { asOf });
    return res.status(201).json({
      success: true,
      data: result.exposures[0] ?? null,
      meta: {
        orchestration: {
          transaction_id: result.transaction_id,
          summary: result.summary,
          jurisdiction: result.jurisdiction,
          exposures: result.exposures,
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// Backward compatible endpoint for current frontend calls.
router.post("/exposures/calculate/:transactionId", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const asOf = req.body?.asOf ? new Date(req.body.asOf) : undefined;
    const result = await runOrchestration(req.params.transactionId, orgId, { asOf });
    return res.status(201).json({
      success: true,
      data: result.exposures[0] ?? null,
      meta: {
        orchestration: {
          transaction_id: result.transaction_id,
          summary: result.summary,
          jurisdiction: result.jurisdiction,
          exposures: result.exposures,
        },
      },
    });
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
