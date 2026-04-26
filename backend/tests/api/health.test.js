const request = require("supertest");
const app = require("../../src/app");

describe("GET /api/health", () => {
  it("returns 200 and success payload", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: "Backend is running",
    });
  });
});
