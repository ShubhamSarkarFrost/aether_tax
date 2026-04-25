const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

function getOrgId(req) {
  return req.headers['x-org-id'] || req.body.org_id;
}

function validateCountryCode(code) {
  return typeof code === 'string' && /^[A-Z]{2}$/.test(code.toUpperCase());
}

router.post('/transactions', async (req, res) => {
  try {
    const org_id = getOrgId(req);
    if (!org_id) {
      return res.status(400).json({ success: false, message: 'org_id is required' });
    }

    const { transaction_type, amount, currency, originating_country, destination_country, is_intercompany, notes } = req.body;

    if (!transaction_type) {
      return res.status(400).json({ success: false, message: 'transaction_type is required' });
    }
    if (amount === undefined || amount === null || amount < 0) {
      return res.status(400).json({ success: false, message: 'amount must be >= 0' });
    }
    if (!currency) {
      return res.status(400).json({ success: false, message: 'currency is required' });
    }
    if (!originating_country || !validateCountryCode(originating_country)) {
      return res.status(400).json({ success: false, message: 'originating_country must be a valid 2-char ISO code' });
    }
    if (!destination_country || !validateCountryCode(destination_country)) {
      return res.status(400).json({ success: false, message: 'destination_country must be a valid 2-char ISO code' });
    }

    const transaction = new Transaction({
      org_id,
      transaction_type,
      amount,
      currency: currency || 'USD',
      originating_country: originating_country.toUpperCase(),
      destination_country: destination_country.toUpperCase(),
      is_intercompany: is_intercompany || false,
      classification_status: 'pending',
      notes,
    });

    await transaction.save();
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const org_id = getOrgId(req);
    if (!org_id) {
      return res.status(400).json({ success: false, message: 'org_id is required' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const filter = { org_id };

    const total = await Transaction.countDocuments(filter);
    const data = await Transaction.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data,
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

router.get('/transactions/:id', async (req, res) => {
  try {
    const org_id = getOrgId(req);
    const transaction = await Transaction.findById(req.params.id).lean();

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (org_id && transaction.org_id !== org_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/transactions/:id/classify', async (req, res) => {
  try {
    const org_id = getOrgId(req);
    const { status } = req.body;

    if (!['classified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be classified or rejected' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (org_id && transaction.org_id !== org_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    transaction.classification_status = status;
    transaction.classified_at = new Date();
    await transaction.save();

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
