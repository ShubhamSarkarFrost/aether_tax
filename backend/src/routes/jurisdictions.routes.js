const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const {
  createJurisdiction,
  listJurisdictions,
  getJurisdictionById,
  updateJurisdictionById,
} = require("../services/jurisdiction.service");

const router = express.Router();

router.post("/", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const jurisdiction = await createJurisdiction(req.body);
    return res.status(201).json({ success: true, data: jurisdiction });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

router.get("/", async (_req, res) => {
  try {
    const jurisdictions = await listJurisdictions();
    return res.json({ success: true, data: jurisdictions });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const jurisdiction = await getJurisdictionById(req.params.id);
    return res.json({ success: true, data: jurisdiction });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.patch("/:id", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const jurisdiction = await updateJurisdictionById(req.params.id, req.body);
    return res.json({ success: true, data: jurisdiction });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

module.exports = router;
