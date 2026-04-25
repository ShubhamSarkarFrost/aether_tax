const express = require('express');
const TaxRecord = require('../models/TaxRecord');

const router = express.Router();

router.get('/tax-records', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const sortBy = req.query.sortBy || 'taxYear';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = {};
    if (req.query.taxYear) {
      const year = parseInt(req.query.taxYear);
      if (!isNaN(year)) filter.taxYear = year;
    }
    if (req.query.entityName) {
      filter.entityName = { $regex: req.query.entityName, $options: 'i' };
    }
    if (req.query.filingStatus) {
      filter.filingStatus = req.query.filingStatus;
    }
    if (req.query.jurisdiction) {
      filter.jurisdiction = { $regex: req.query.jurisdiction, $options: 'i' };
    }

    const total = await TaxRecord.countDocuments(filter);
    const records = await TaxRecord.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/tax-records', async (req, res) => {
  try {
    const { taxYear, entityName, taxAmount } = req.body;
    if (!taxYear || !entityName || taxAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'taxYear, entityName, and taxAmount are required',
      });
    }

    const record = new TaxRecord(req.body);
    await record.save();
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
