jest.mock("../../src/models/TaxExposure", () => ({
  find: jest.fn(),
  findById: jest.fn(),
}));

const TaxExposure = require("../../src/models/TaxExposure");
const { getTaxExposureById, listTaxExposuresByTransaction } = require("../../src/services/taxExposure.service");

describe("taxExposure.service (tenant isolation)", () => {
  afterEach(() => jest.clearAllMocks());

  it("getTaxExposureById returns 404 when missing", async () => {
    TaxExposure.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    await expect(getTaxExposureById("id1", "org-1")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("getTaxExposureById returns 403 for other org", async () => {
    TaxExposure.findById.mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: "1", org_id: "other" }),
    });
    await expect(getTaxExposureById("1", "org-1")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("listTaxExposuresByTransaction filters to org", async () => {
    const rows = [
      { org_id: "org-1", transaction_id: "t1" },
      { org_id: "other", transaction_id: "t1" },
    ];
    TaxExposure.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(rows) }),
    });
    const out = await listTaxExposuresByTransaction("t1", "org-1");
    expect(out).toEqual([{ org_id: "org-1", transaction_id: "t1" }]);
  });
});
