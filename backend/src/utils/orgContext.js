function getOrgIdFromRequest(req) {
  return req.user?.orgId || req.headers["x-org-id"] || req.body?.org_id || null;
}

module.exports = {
  getOrgIdFromRequest,
};
