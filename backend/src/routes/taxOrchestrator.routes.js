const express = require("express");
const { runOrchestration } = require("../services/taxOrchestrator.service");
const { getOrgIdFromRequest } = require("../utils/orgContext");

const router = express.Router();

/**
 * POST /api/tax-orchestrator/run/:transactionId
 * Body: { "asOf": "optional ISO-8601 date" }
 * Runs the full multi-rule mapping and returns all exposures + summary.
 */
router.post("/tax-orchestrator/run/:transactionId", async (req, res) => {
  try {
    const orgId = getOrgIdFromRequest(req);
    const asOf = req.body?.asOf ? new Date(req.body.asOf) : undefined;
    if (asOf && Number.isNaN(asOf.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid asOf date" });
    }
    const result = await runOrchestration(req.params.transactionId, orgId, { asOf });
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = router;
