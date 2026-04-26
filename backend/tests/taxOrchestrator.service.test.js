jest.mock("../src/models/Transaction", () => ({
  findById: jest.fn(),
}));

jest.mock("../src/models/Jurisdiction", () => ({
  findOne: jest.fn(),
}));

jest.mock("../src/models/JurisdictionRule", () => ({
  find: jest.fn(),
}));

jest.mock("../src/models/TaxExposure", () => ({
  deleteMany: jest.fn(),
  insertMany: jest.fn(),
}));

const Transaction = require("../src/models/Transaction");
const Jurisdiction = require("../src/models/Jurisdiction");
const JurisdictionRule = require("../src/models/JurisdictionRule");
const TaxExposure = require("../src/models/TaxExposure");
const {
  runOrchestration,
  findActiveRulesForJurisdiction,
  ruleAppliesToTransaction,
  computeLineItem,
} = require("../src/services/taxOrchestrator.service");

const TX_ID = "507f1f77bcf86cd799439011";
const JUR_ID = "507f1f77bcf86cd799439012";
const RULE_ID = "507f1f77bcf86cd799439013";

const baseRule = (overrides = {}) => ({
  _id: RULE_ID,
  tax_category: "VAT",
  standard_rate: 0.1,
  rule_logic: "standard",
  applies_to_transaction_types: [],
  ...overrides,
});

const baseTransaction = (overrides = {}) => ({
  _id: { toString: () => TX_ID },
  org_id: "org-1",
  amount: 200,
  transaction_type: "sale",
  destination_country: "US",
  ...overrides,
});

const leanJurisdiction = (overrides = {}) => ({
  _id: JUR_ID,
  country_code: "US",
  ...overrides,
});

function ruleFindChain(rules) {
  return {
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(rules),
    }),
  };
}

function setupHappyPath(overrides = {}) {
  const tx = baseTransaction(overrides.transaction);
  const jurisdiction = leanJurisdiction(overrides.jurisdiction);
  const rules = overrides.rules ?? [baseRule()];

  Transaction.findById.mockResolvedValue(tx);
  Jurisdiction.findOne.mockReturnValue({
    lean: jest.fn().mockResolvedValue(jurisdiction),
  });
  JurisdictionRule.find.mockReturnValue(ruleFindChain(rules));
  TaxExposure.deleteMany.mockResolvedValue({ deletedCount: 0 });
  TaxExposure.insertMany.mockImplementation((docs) =>
    Promise.resolve(
      docs.map((d, i) => {
        const doc = { ...d, _id: `exp-${i}` };
        return { ...doc, toObject: () => doc };
      })
    )
  );
}

describe("ruleAppliesToTransaction", () => {
  it("returns true when applies_to is empty (any type)", () => {
    const tx = { transaction_type: "sale" };
    expect(ruleAppliesToTransaction(tx, { applies_to_transaction_types: [] })).toBe(true);
  });

  it("returns true when type is in applies_to", () => {
    const tx = { transaction_type: "royalty" };
    expect(
      ruleAppliesToTransaction(tx, { applies_to_transaction_types: ["sale", "royalty"] })
    ).toBe(true);
  });

  it("returns false when applies_to is set and type is not listed", () => {
    const tx = { transaction_type: "dividend" };
    expect(
      ruleAppliesToTransaction(tx, { applies_to_transaction_types: ["sale", "service"] })
    ).toBe(false);
  });
});

describe("computeLineItem", () => {
  const asOf = new Date("2024-01-15T00:00:00.000Z");
  const tx = {
    _id: TX_ID,
    org_id: "org-1",
    amount: 100,
    transaction_type: "sale",
  };
  const jurisdiction = { _id: JUR_ID, country_code: "US" };

  it("computes tax_due and includes rule_logic in basis when present", () => {
    const rule = baseRule({ standard_rate: 0.2, rule_logic: "gross" });
    const line = computeLineItem(tx, jurisdiction, rule, asOf);
    expect(line.taxable_amount).toBe(100);
    expect(line.tax_rate).toBe(0.2);
    expect(line.tax_due).toBe(20);
    expect(line.calculation_basis).toContain("rate=0.2");
    expect(line.calculation_basis).toContain("basis=gross");
    expect(line.confidence_score).toBe(0.9);
  });

  it("uses default basis phrasing when rule_logic is missing", () => {
    const rule = baseRule({ rule_logic: undefined, standard_rate: 0.1 });
    const line = computeLineItem(tx, jurisdiction, rule, asOf);
    expect(line.calculation_basis).toContain("tax_due = taxable_amount * tax_rate");
  });

  it("lowers confidence when rule does not apply to transaction type", () => {
    const rule = baseRule({ applies_to_transaction_types: ["purchase"] });
    const line = computeLineItem(tx, jurisdiction, rule, asOf);
    expect(line.confidence_score).toBe(0.55);
  });
});

describe("findActiveRulesForJurisdiction", () => {
  it("queries active rules with validity window and sorts", async () => {
    const expected = [baseRule()];
    JurisdictionRule.find.mockReturnValue(ruleFindChain(expected));
    const asOf = new Date("2024-06-01T12:00:00.000Z");
    const result = await findActiveRulesForJurisdiction(JUR_ID, asOf);
    expect(result).toEqual(expected);
    expect(JurisdictionRule.find).toHaveBeenCalledWith({
      jurisdiction_id: JUR_ID,
      active: true,
      valid_from: { $lte: asOf },
      $or: [{ valid_to: null }, { valid_to: { $gt: asOf } }],
    });
    const chain = JurisdictionRule.find.mock.results[0].value;
    expect(chain.sort).toHaveBeenCalledWith({ valid_from: -1, tax_category: 1, rule_type: 1 });
  });
});

describe("runOrchestration", () => {
  const asOf = new Date("2024-03-01T00:00:00.000Z");

  it("throws 404 when transaction is missing", async () => {
    Transaction.findById.mockResolvedValue(null);
    await expect(runOrchestration(TX_ID, "org-1", {})).rejects.toMatchObject({
      message: "Transaction not found",
      statusCode: 404,
    });
  });

  it("throws 403 when orgId is provided and does not match", async () => {
    Transaction.findById.mockResolvedValue(baseTransaction({ org_id: "other" }));
    await expect(runOrchestration(TX_ID, "org-1", {})).rejects.toMatchObject({
      message: "Access denied",
      statusCode: 403,
    });
  });

  it("throws 422 when no active jurisdiction for destination country", async () => {
    setupHappyPath();
    Jurisdiction.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    await expect(runOrchestration(TX_ID, "org-1", {})).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringMatching(/No active jurisdiction/),
    });
  });

  it("throws 422 when no rules apply to the transaction", async () => {
    Transaction.findById.mockResolvedValue(baseTransaction());
    Jurisdiction.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(leanJurisdiction()),
    });
    JurisdictionRule.find.mockReturnValue(
      ruleFindChain([baseRule({ applies_to_transaction_types: ["purchase"] })])
    );
    await expect(runOrchestration(TX_ID, "org-1", {})).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it("inserts exposures, replaces existing by default, and returns summary", async () => {
    setupHappyPath();
    const result = await runOrchestration(TX_ID, "org-1", { asOf });
    expect(TaxExposure.deleteMany).toHaveBeenCalled();
    expect(TaxExposure.insertMany).toHaveBeenCalled();
    expect(result.transaction_id).toBe(TX_ID);
    expect(result.jurisdiction.country_code).toBe("US");
    expect(result.exposures).toHaveLength(1);
    expect(result.summary.rule_count).toBe(1);
    expect(result.summary.as_of).toBe(asOf.toISOString());
    expect(result.summary.total_tax_due).toBe(200 * 0.1);
  });

  it("skips deleteMany when replaceExisting is false", async () => {
    setupHappyPath();
    await runOrchestration(TX_ID, "org-1", { asOf, replaceExisting: false });
    expect(TaxExposure.deleteMany).not.toHaveBeenCalled();
  });

  it("allows matching orgId check to pass with correct org", async () => {
    setupHappyPath({ transaction: { org_id: "acme" } });
    const result = await runOrchestration(TX_ID, "acme", { asOf });
    expect(result.summary.rule_count).toBe(1);
  });

  it("does not require orgId (optional)", async () => {
    setupHappyPath();
    const result = await runOrchestration(TX_ID, undefined, { asOf });
    expect(result.summary.total_tax_due).toBe(20);
  });

  it("maps multiple tax categories (GST, WHT, corporate) as separate line items", async () => {
    const asOf2 = new Date("2024-01-10T00:00:00.000Z");
    Transaction.findById.mockResolvedValue(baseTransaction());
    Jurisdiction.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(leanJurisdiction()),
    });
    JurisdictionRule.find.mockReturnValue(
      ruleFindChain([
        baseRule({ _id: "r-gst", tax_category: "GST", standard_rate: 0.1 }),
        baseRule({ _id: "r-wht", tax_category: "WHT", standard_rate: 0.05 }),
        baseRule({ _id: "r-corp", tax_category: "Corporate_Tax", standard_rate: 0.2 }),
      ])
    );
    TaxExposure.insertMany.mockImplementation((docs) =>
      Promise.resolve(
        docs.map((d) => {
          const doc = { ...d, _id: `ex-${d.tax_type}` };
          return { ...doc, toObject: () => doc };
        })
      )
    );
    const result = await runOrchestration(TX_ID, "org-1", { asOf: asOf2, replaceExisting: true });
    const types = result.exposures.map((e) => e.tax_type);
    expect(types).toEqual(expect.arrayContaining(["GST", "WHT", "Corporate_Tax"]));
    expect(result.summary.total_tax_due).toBeCloseTo(200 * 0.1 + 200 * 0.05 + 200 * 0.2, 5);
  });
});
