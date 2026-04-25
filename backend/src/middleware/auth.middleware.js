const { verifyToken } = require("../utils/jwt");

function parseBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
}

function decorateUserFromRequest(req) {
  const token = parseBearerToken(req);
  if (!token) {
    return null;
  }
  const payload = verifyToken(token);
  req.user = {
    userId: payload.userId,
    orgId: payload.orgId,
    role: payload.role,
  };
  return req.user;
}

function requireAuth(req, res, next) {
  try {
    if (decorateUserFromRequest(req)) {
      return next();
    }
    return res.status(401).json({ success: false, message: "Unauthorized" });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

function optionalAuth(req, _res, next) {
  try {
    decorateUserFromRequest(req);
  } catch (_error) {
    // Ignore token parse errors so existing x-org-id flow continues to work.
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};
