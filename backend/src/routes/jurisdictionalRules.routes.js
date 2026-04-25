const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const {
  createJurisdictionRule,
  listJurisdictionRules,
  getJurisdictionRuleById,
  updateJurisdictionRuleById,
} = require("../services/jurisdictionRule.service");

const router = express.Router();

router.post("/", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const rule = await createJurisdictionRule(req.body);
    return res.status(201).json({ success: true, data: rule });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const rules = await listJurisdictionRules();
    return res.json({ success: true, data: rules });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const rule = await getJurisdictionRuleById(req.params.id);
    return res.json({ success: true, data: rule });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.patch("/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const rule = await updateJurisdictionRuleById(req.params.id, req.body);
    return res.json({ success: true, data: rule });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

module.exports = router;
