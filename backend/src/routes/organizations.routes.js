const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");
const {
  createOrganization,
  getOrganizationById,
  updateOrganizationById,
} = require("../services/organization.service");

const router = express.Router();

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const organization = await createOrganization(req.body);
    return res.status(201).json({ success: true, data: organization });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const organization = await getOrganizationById(req.user.orgId);
    return res.json({ success: true, data: organization });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.patch("/me", requireAuth, requireRole("admin", "manager"), async (req, res) => {
  try {
    const organization = await updateOrganizationById(req.user.orgId, req.body);
    return res.json({ success: true, data: organization });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ success: false, message: error.message });
  }
});

module.exports = router;
