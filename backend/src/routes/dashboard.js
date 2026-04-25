const express = require("express");
const { getOrgIdFromRequest } = require("../utils/orgContext");
const { getDashboardSummary } = require("../services/dashboard.service");

const router = express.Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const org_id = getOrgIdFromRequest(req);
    const summary = await getDashboardSummary(org_id);

    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
