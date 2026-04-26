const request = require("supertest");
const { signToken } = require("../../src/utils/jwt");

jest.mock("../../src/services/auth.service", () => {
  const actual = jest.requireActual("../../src/services/auth.service");
  return {
    ...actual,
    getCurrentUser: jest.fn().mockResolvedValue({
      _id: "user-1",
      full_name: "Test",
      email: "t@test.com",
      role: "admin",
      org_id: "org-1",
    }),
  };
});

const { getCurrentUser } = require("../../src/services/auth.service");
const app = require("../../src/app");

describe("GET /api/auth/me", () => {
  afterEach(() => {
    getCurrentUser.mockClear();
  });

  it("returns 401 when Authorization is missing", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Unauthorized/i);
  });

  it("returns 401 for tampered/invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    expect(res.status).toBe(401);
  });

  it("returns 200 and user when JWT is valid", async () => {
    const token = signToken({ userId: "user-1", orgId: "org-1", role: "admin" });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe("t@test.com");
    expect(getCurrentUser).toHaveBeenCalledWith("user-1");
  });
});
