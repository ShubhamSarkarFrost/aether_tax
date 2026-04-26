const jwt = require("jsonwebtoken");
const { requireAuth, optionalAuth } = require("../../src/middleware/auth.middleware");
const { signToken } = require("../../src/utils/jwt");

// decorateUserFromRequest is not exported - test requireAuth / optionalAuth only

function mockRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
}

describe("requireAuth", () => {
  it("returns 401 when Authorization header is missing", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Unauthorized" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token is invalid (bad signature)", () => {
    const req = { headers: { authorization: "Bearer not-a-real.jwt.token" } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid token" });
  });

  it("returns 401 for expired JWT", () => {
    const expired = jwt.sign(
      { userId: "u1", orgId: "o1", role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "-1h" }
    );
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid token" });
  });

  it("calls next when Bearer token is valid", () => {
    const token = signToken({ userId: "u1", orgId: "o1", role: "admin" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: "u1", orgId: "o1", role: "admin" });
  });
});

describe("optionalAuth", () => {
  it("ignores bad token and still calls next (no 401)", () => {
    const req = { headers: { authorization: "Bearer totally-invalid" } };
    const res = mockRes();
    const next = jest.fn();
    optionalAuth(req, res, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("decorates user when token valid", () => {
    const token = signToken({ userId: "u2", orgId: "o2", role: "viewer" });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    optionalAuth(req, {}, next);
    expect(req.user).toEqual({ userId: "u2", orgId: "o2", role: "viewer" });
  });
});
