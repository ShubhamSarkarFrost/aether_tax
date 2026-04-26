jest.mock("../../src/models/Transaction", () => ({
  countDocuments: jest.fn(),
}));

jest.mock("../../src/models/TaxExposure", () => ({
  aggregate: jest.fn(),
}));

jest.mock("../../src/models/TaxRecord", () => {
  const taxRecord = {
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    schema: { path: jest.fn() },
  };
  return taxRecord;
});

const Transaction = require("../../src/models/Transaction");
const TaxExposure = require("../../src/models/TaxExposure");
const TaxRecord = require("../../src/models/TaxRecord");
const { getDashboardSummary } = require("../../src/services/dashboard.service");

describe("getDashboardSummary (exposure by tax type + jurisdiction)", () => {
  it("returns summary with GST/WHT breakdown and org-scoped counts", async () => {
    Transaction.countDocuments.mockResolvedValue(3);
    TaxRecord.countDocuments.mockResolvedValue(2);

    TaxExposure.aggregate
      .mockResolvedValueOnce([{ total_exposure: 100, avg_confidence_score: 0.8 }])
      .mockResolvedValueOnce([{ jurisdiction_id: "j1", tax_due: 100, count: 3 }])
      .mockResolvedValueOnce([
        { tax_type: "GST", tax_due: 60, count: 2 },
        { tax_type: "WHT", tax_due: 20, count: 1 },
        { tax_type: "Corporate_Tax", tax_due: 20, count: 1 },
      ])
      .mockResolvedValueOnce([{ jurisdiction_id: "j1", country_code: "US", name: "United States", tax_due: 100, count: 3 }]);

    TaxRecord.aggregate
      .mockResolvedValueOnce([{ _id: "pending", count: 2 }])
      .mockResolvedValueOnce([
        { total_tax_amount: 500, total_tax_paid: 200, total_outstanding_liability: 300 },
      ]);

    const summary = await getDashboardSummary("org-1");

    expect(summary.total_transactions).toBe(3);
    expect(summary.total_exposure).toBe(100);
    expect(summary.exposure_by_tax_type).toHaveLength(3);
    expect(summary.exposure_by_tax_type.find((r) => r.tax_type === "GST").tax_due).toBe(60);
    expect(summary.jurisdiction_labeled[0].country_code).toBe("US");
    expect(summary.total_tax_records).toBe(2);
    expect(Transaction.countDocuments).toHaveBeenCalledWith({ org_id: "org-1" });
  });
});
