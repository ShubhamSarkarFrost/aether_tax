const Transaction = require("../models/Transaction");
const TaxExposure = require("../models/TaxExposure");
const TaxRecord = require("../models/TaxRecord");

async function getDashboardSummary(orgId) {
  const txFilter = orgId ? { org_id: orgId } : {};
  const expFilter = orgId ? { org_id: orgId } : {};
  const taxRecordFilter =
    orgId && TaxRecord.schema.path("org_id") ? { org_id: orgId } : {};

  const expFilterOId = orgId
    ? { $match: { org_id: orgId } }
    : { $match: {} };

  const [
    total_transactions,
    cross_border_count,
    classified_count,
    pending_count,
    exposureAgg,
    jurisdictionBreakdown,
    total_tax_records,
    taxRecordsByStatusAgg,
    taxRecordsTotalsAgg,
    exposureByTaxType,
    jurisdictionLabeled,
  ] = await Promise.all([
    Transaction.countDocuments(txFilter),
    Transaction.countDocuments({ ...txFilter, is_cross_border: true }),
    Transaction.countDocuments({ ...txFilter, classification_status: "classified" }),
    Transaction.countDocuments({ ...txFilter, classification_status: "pending" }),
    TaxExposure.aggregate([
      { $match: expFilter },
      {
        $group: {
          _id: null,
          total_exposure: { $sum: "$tax_due" },
          avg_confidence_score: { $avg: "$confidence_score" },
        },
      },
    ]),
    TaxExposure.aggregate([
      { $match: expFilter },
      {
        $group: {
          _id: "$jurisdiction_id",
          tax_due: { $sum: "$tax_due" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, jurisdiction_id: "$_id", tax_due: 1, count: 1 } },
      { $sort: { tax_due: -1 } },
    ]),
    TaxRecord.countDocuments(taxRecordFilter),
    TaxRecord.aggregate([
      { $match: taxRecordFilter },
      {
        $group: {
          _id: "$filingStatus",
          count: { $sum: 1 },
        },
      },
    ]),
    TaxRecord.aggregate([
      { $match: taxRecordFilter },
      {
        $group: {
          _id: null,
          total_tax_amount: { $sum: "$taxAmount" },
          total_tax_paid: { $sum: { $ifNull: ["$taxPaid", 0] } },
          total_outstanding_liability: {
            $sum: {
              $ifNull: [
                "$outstandingLiability",
                {
                  $max: [
                    {
                      $subtract: ["$taxAmount", { $ifNull: ["$taxPaid", 0] }],
                    },
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
    ]),
    TaxExposure.aggregate([
      expFilterOId,
      {
        $group: {
          _id: "$tax_type",
          tax_due: { $sum: "$tax_due" },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, tax_type: "$_id", tax_due: 1, count: 1 } },
      { $sort: { tax_due: -1 } },
    ]),
    TaxExposure.aggregate([
      expFilterOId,
      {
        $lookup: {
          from: "jurisdictions",
          let: { jid: "$jurisdiction_id" },
          pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$jid"] } } }, { $project: { country_code: 1, name: 1 } }],
          as: "jur",
        },
      },
      { $unwind: { path: "$jur", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$jurisdiction_id",
          tax_due: { $sum: "$tax_due" },
          count: { $sum: 1 },
          country_code: { $first: "$jur.country_code" },
          name: { $first: "$jur.name" },
        },
      },
      {
        $project: {
          _id: 0,
          jurisdiction_id: "$_id",
          country_code: 1,
          name: 1,
          tax_due: 1,
          count: 1,
        },
      },
      { $sort: { tax_due: -1 } },
    ]),
  ]);

  const filing_status_counts = {
    filed: 0,
    pending: 0,
    amended: 0,
    unfiled: 0,
    unknown: 0,
  };

  taxRecordsByStatusAgg.forEach(({ _id, count }) => {
    if (_id && Object.prototype.hasOwnProperty.call(filing_status_counts, _id)) {
      filing_status_counts[_id] = count;
      return;
    }
    filing_status_counts.unknown += count;
  });

  const taxRecordTotals = taxRecordsTotalsAgg[0] || {};

  return {
    total_transactions,
    total_exposure: exposureAgg[0]?.total_exposure || 0,
    cross_border_count,
    classified_count,
    pending_count,
    jurisdiction_breakdown: jurisdictionBreakdown,
    jurisdiction_labeled: jurisdictionLabeled,
    exposure_by_tax_type: exposureByTaxType,
    avg_confidence_score: exposureAgg[0]?.avg_confidence_score || 0,
    total_tax_records,
    filing_status_counts,
    total_tax_amount: taxRecordTotals.total_tax_amount || 0,
    total_tax_paid: taxRecordTotals.total_tax_paid || 0,
    total_outstanding_liability: taxRecordTotals.total_outstanding_liability || 0,
  };
}

module.exports = {
  getDashboardSummary,
};
