const request = require("supertest");

jest.mock("../../src/services/transaction.service", () => ({
  createTransaction: jest.fn(),
  listTransactions: jest.fn(),
  getTransactionById: jest.fn(),
  classifyTransaction: jest.fn(),
}));

const service = require("../../src/services/transaction.service");
const app = require("../../src/app");

const orgHeaders = { "x-org-id": "org-1" };

describe("Transactions API (tenant + validation integration)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/transactions", () => {
    it("returns 201 when org present via header and service succeeds", async () => {
      const created = { _id: "t1", org_id: "org-1", amount: 10 };
      service.createTransaction.mockResolvedValue(created);
      const res = await request(app)
        .post("/api/transactions")
        .set(orgHeaders)
        .send({ transaction_type: "sale", amount: 10, currency: "USD", originating_country: "US", destination_country: "US" });
      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(created);
      expect(service.createTransaction).toHaveBeenCalled();
    });

    it("forwards 400 from service (e.g. missing org in context)", async () => {
      service.createTransaction.mockRejectedValue(Object.assign(new Error("org_id is required"), { statusCode: 400 }));
      const res = await request(app).post("/api/transactions").send({ transaction_type: "sale" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/transactions", () => {
    it("returns paginated data for org", async () => {
      service.listTransactions.mockResolvedValue({
        data: [{ _id: "1" }],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
      const res = await request(app).get("/api/transactions").set(orgHeaders).query({ limit: 5 });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([{ _id: "1" }]);
    });
  });

  describe("GET /api/transactions/:id", () => {
    it("returns 403 when service denies cross-tenant access", async () => {
      service.getTransactionById.mockRejectedValue(Object.assign(new Error("Access denied"), { statusCode: 403 }));
      const res = await request(app).get("/api/transactions/507f1f77bcf86cd799439011").set(orgHeaders);
      expect(res.status).toBe(403);
    });

    it("returns 404 when not found", async () => {
      service.getTransactionById.mockRejectedValue(Object.assign(new Error("Transaction not found"), { statusCode: 404 }));
      const res = await request(app).get("/api/transactions/507f1f77bcf86cd799439011").set(orgHeaders);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/transactions/:id/classify", () => {
    it("returns 403 on cross-tenant classify", async () => {
      service.classifyTransaction.mockRejectedValue(Object.assign(new Error("Access denied"), { statusCode: 403 }));
      const res = await request(app)
        .post("/api/transactions/507f1f77bcf86cd799439011/classify")
        .set(orgHeaders)
        .send({ status: "classified" });
      expect(res.status).toBe(403);
    });
  });
});
