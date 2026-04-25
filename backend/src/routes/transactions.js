const express = require("express");
const { getOrgIdFromRequest } = require("../utils/orgContext");
const {
  createTransaction,
  listTransactions,
  getTransactionById,
  classifyTransaction,
} = require("../services/transaction.service");

const router = express.Router();
router.post("/transactions", async (req, res) => {
  try {
    const org_id = getOrgIdFromRequest(req);
    const transaction = await createTransaction(req.body, org_id);
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const org_id = getOrgIdFromRequest(req);
    const result = await listTransactions(org_id, req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

router.get("/transactions/:id", async (req, res) => {
  try {
    const org_id = getOrgIdFromRequest(req);
    const transaction = await getTransactionById(req.params.id, org_id);
    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

router.post("/transactions/:id/classify", async (req, res) => {
  try {
    const org_id = getOrgIdFromRequest(req);
    const transaction = await classifyTransaction(req.params.id, req.body.status, org_id);
    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
