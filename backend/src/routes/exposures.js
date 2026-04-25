const express = require('express');
const Transaction = require('../models/Transaction');
const JurisdictionRule = require('../models/JurisdictionRule');
const TaxExposure = require('../models/TaxExposure');

const router = express.Router();

function getOrgId(req) {
  return req.headers['x-org-id'] || req.body.org_id;
}

router.post('/exposures/calculate/:transactionId', async (req, res) => {
  try {
    const org_id = getOrgId(req);
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (org_id && transaction.org_id !== org_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const now = new Date();
    const rule = await JurisdictionRule.findOne({
      country_code: transaction.destination_country,
      transaction_type: transaction.transaction_type,
      is_active: true,
      effective_from: { $lte: now },
      $or: [{ effective_to: null }, { effective_to: { $gt: now } }],
    });

    if (!rule) {
      return res.status(422).json({
        success: false,
        message: `No active jurisdiction rule found for country ${transaction.destination_country} and transaction type ${transaction.transaction_type}`,
      });
    }

    const taxable_amount = transaction.amount;
    const tax_rate = rule.tax_rate;
    const tax_due = taxable_amount * tax_rate;
    const confidence_score = 1.0;

    const exposure = new TaxExposure({
      transaction_id: transaction._id,
      org_id: transaction.org_id,
      jurisdiction_id: rule.jurisdiction_id,
      rule_id: rule._id,
      tax_type: rule.tax_type,
      taxable_amount,
      tax_rate,
      tax_due,
      confidence_score,
      calculated_at: new Date(),
    });

    await exposure.save();
    res.status(201).json({ success: true, data: exposure });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/exposures/transaction/:transactionId', async (req, res) => {
  try {
    const org_id = getOrgId(req);
    const transaction = await Transaction.findById(req.params.transactionId).lean();

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    if (org_id && transaction.org_id !== org_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const exposures = await TaxExposure.find({ transaction_id: req.params.transactionId }).lean();
    res.json({ success: true, data: exposures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/exposures', async (req, res) => {
  try {
    const org_id = getOrgId(req);
    const filter = org_id ? { org_id } : {};
    const exposures = await TaxExposure.find(filter).lean();
    res.json({ success: true, data: exposures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
