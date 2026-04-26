const { getOrgIdFromRequest } = require("../../src/utils/orgContext");

describe("getOrgIdFromRequest", () => {
  it("prefers user orgId from JWT", () => {
    const req = { user: { orgId: "from-jwt" }, headers: {} };
    expect(getOrgIdFromRequest(req)).toBe("from-jwt");
  });

  it("uses x-org-id when user orgId absent", () => {
    const req = { user: null, headers: { "x-org-id": "hdr-org" } };
    expect(getOrgIdFromRequest(req)).toBe("hdr-org");
  });

  it("falls back to body.org_id", () => {
    const req = { user: null, headers: {}, body: { org_id: "body-org" } };
    expect(getOrgIdFromRequest(req)).toBe("body-org");
  });

  it("returns null when no org context", () => {
    expect(getOrgIdFromRequest({ user: null, headers: {}, body: {} })).toBeNull();
  });
});
