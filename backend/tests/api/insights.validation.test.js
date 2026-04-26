const request = require("supertest");
const app = require("../../src/app");

/** Validates query params for insights routes without calling Gemini. */
describe("GET /api/insights/* (validation)", () => {
  it("returns 400 when countries query is missing for tax-rates", async () => {
    const res = await request(app).get("/api/insights/tax-rates");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/countries/i);
  });

  it("returns 400 when country/taxCategory missing for suggested-rule-rate", async () => {
    const res = await request(app).get("/api/insights/suggested-rule-rate");
    expect(res.status).toBe(400);
  });
});
