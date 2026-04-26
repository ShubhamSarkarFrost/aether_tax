const request = require("supertest");

jest.mock("../../src/services/dashboard.service", () => ({
  getDashboardSummary: jest.fn().mockResolvedValue({
    total_transactions: 0,
    total_exposure: 0,
    cross_border_count: 0,
    classified_count: 0,
    pending_count: 0,
    jurisdiction_breakdown: [],
    jurisdiction_labeled: [],
    exposure_by_tax_type: [],
    avg_confidence_score: 0,
    total_tax_records: 0,
    filing_status_counts: { filed: 0, pending: 0, amended: 0, unfiled: 0, unknown: 0 },
    total_tax_amount: 0,
    total_tax_paid: 0,
    total_outstanding_liability: 0,
  }),
}));

const { getDashboardSummary } = require("../../src/services/dashboard.service");
const app = require("../../src/app");

describe("GET /api/dashboard/summary (Tax Exposure dashboard API)", () => {
  it("returns success with org from x-org-id", async () => {
    const res = await request(app).get("/api/dashboard/summary").set("x-org-id", "org-1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(getDashboardSummary).toHaveBeenCalledWith("org-1");
  });
});
