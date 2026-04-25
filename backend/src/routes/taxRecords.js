const express = require("express");
const {
  listTaxRecords,
  createTaxRecord,
  bulkCreateTaxRecords,
  updateTaxRecordFilingStatus,
} = require("../services/taxRecord.service");

const router = express.Router();

router.get("/tax-records", async (req, res) => {
  try {
    const result = await listTaxRecords(req.query);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

router.post("/tax-records", async (req, res) => {
  try {
    const record = await createTaxRecord(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

router.post("/tax-records/upload", async (req, res) => {
  try {
    const { records } = req.body || {};
    const inserted = await bulkCreateTaxRecords(records);
    res.status(201).json({
      success: true,
      message: `${inserted.length} records uploaded`,
      count: inserted.length,
      data: inserted,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

router.patch("/tax-records/:id/filing-status", async (req, res) => {
  try {
    const { filingStatus } = req.body || {};
    const updated = await updateTaxRecordFilingStatus(req.params.id, filingStatus);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

module.exports = router;
