const express = require('express');
const Transaction = require('../models/Transaction');
const TaxExposure = require('../models/TaxExposure');

const router = express.Router();

router.get('/dashboard/summary', async (req, res) => {
  try {
    const org_id = req.headers['x-org-id'];
    const txFilter = org_id ? { org_id } : {};
    const expFilter = org_id ? { org_id } : {};

    const [
      total_transactions,
      cross_border_count,
      classified_count,
      pending_count,
      exposureAgg,
      jurisdictionBreakdown,
    ] = await Promise.all([
      Transaction.countDocuments(txFilter),
      Transaction.countDocuments({ ...txFilter, cross_border: true }),
      Transaction.countDocuments({ ...txFilter, classification_status: 'classified' }),
      Transaction.countDocuments({ ...txFilter, classification_status: 'pending' }),
      TaxExposure.aggregate([
        { $match: expFilter },
        {
          $group: {
            _id: null,
            total_exposure: { $sum: '$tax_due' },
            avg_confidence_score: { $avg: '$confidence_score' },
          },
        },
      ]),
      TaxExposure.aggregate([
        { $match: expFilter },
        {
          $group: {
            _id: '$jurisdiction_id',
            tax_due: { $sum: '$tax_due' },
            count: { $sum: 1 },
          },
        },
        { $project: { _id: 0, jurisdiction_id: '$_id', tax_due: 1, count: 1 } },
        { $sort: { tax_due: -1 } },
      ]),
    ]);

    const total_exposure = exposureAgg[0]?.total_exposure || 0;
    const avg_confidence_score = exposureAgg[0]?.avg_confidence_score || 0;

    res.json({
      success: true,
      data: {
        total_transactions,
        total_exposure,
        cross_border_count,
        classified_count,
        pending_count,
        jurisdiction_breakdown: jurisdictionBreakdown,
        avg_confidence_score,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
