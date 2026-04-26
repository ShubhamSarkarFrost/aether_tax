const request = require("supertest");

jest.mock("../../src/services/taxOrchestrator.service", () => ({
  runOrchestration: jest.fn(),
}));

jest.mock("../../src/services/taxExposure.service", () => ({
  listTaxExposures: jest.fn().mockResolvedValue([{ _id: "e1" }]),
  getTaxExposureById: jest.fn(),
  listTaxExposuresByTransaction: jest.fn().mockResolvedValue([{ _id: "e1", org_id: "org-1", tax_type: "GST" }]),
}));

const { runOrchestration } = require("../../src/services/taxOrchestrator.service");
const { listTaxExposuresByTransaction } = require("../../src/services/taxExposure.service");
const app = require("../../src/app");

const orgHeaders = { "x-org-id": "org-1" };

const sampleResult = {
  transaction_id: "tx-1",
  jurisdiction: { _id: "j1", country_code: "US" },
  exposures: [
    { _id: "e1", tax_type: "VAT", tax_due: 10, toObject: () => ({ tax_type: "VAT", tax_due: 10 }) },
    { _id: "e2", tax_type: "WHT", tax_due: 5, toObject: () => ({ tax_type: "WHT", tax_due: 5 }) },
  ],
  summary: { total_tax_due: 15, rule_count: 2, as_of: new Date().toISOString() },
};

describe("Tax exposure & jurisdiction engine HTTP layer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/tax-exposures/calculate/:id returns 201 with first exposure and full orchestration (VAT + WHT lanes)", async () => {
    runOrchestration.mockResolvedValue(sampleResult);
    const res = await request(app)
      .post("/api/tax-exposures/calculate/tx-1")
      .set(orgHeaders)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.meta.orchestration.exposures).toHaveLength(2);
    expect(res.body.meta.orchestration.summary.total_tax_due).toBe(15);
  });

  it("POST /api/tax-exposures/calculate/:id forwards 422 from engine", async () => {
    const err = new Error("No active jurisdiction");
    err.statusCode = 422;
    runOrchestration.mockRejectedValue(err);
    const res = await request(app).post("/api/tax-exposures/calculate/tx-1").set(orgHeaders);
    expect(res.status).toBe(422);
  });

  it("GET /api/exposures/transaction/:transactionId returns exposures for org", async () => {
    const res = await request(app)
      .get("/api/exposures/transaction/tx-1")
      .set(orgHeaders);
    expect(res.status).toBe(200);
    expect(res.body.data[0].tax_type).toBe("GST");
    expect(listTaxExposuresByTransaction).toHaveBeenCalled();
  });
});
