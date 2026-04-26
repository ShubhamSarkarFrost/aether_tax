jest.mock("../../src/models/Transaction", () => ({
  create: jest.fn(),
  countDocuments: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

const Transaction = require("../../src/models/Transaction");
const {
  createTransaction,
  listTransactions,
  getTransactionById,
  classifyTransaction,
} = require("../../src/services/transaction.service");

const baseInput = {
  transaction_type: "sale",
  amount: 100,
  currency: "USD",
  originating_country: "us",
  destination_country: "de",
  notes: "n",
};

describe("createTransaction", () => {
  beforeEach(() => {
    Transaction.create.mockImplementation(async (doc) => ({
      ...doc,
      _id: "new-id",
      toJSON: function () {
        return this;
      },
    }));
  });

  it("rejects when orgId missing", async () => {
    await expect(createTransaction(baseInput, null)).rejects.toMatchObject({
      message: "org_id is required",
      statusCode: 400,
    });
  });

  it("rejects when transaction_type missing", async () => {
    const { transaction_type, ...rest } = baseInput;
    await expect(createTransaction(rest, "org-1")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects when amount is negative", async () => {
    await expect(createTransaction({ ...baseInput, amount: -1 }, "org-1")).rejects.toMatchObject({
      message: "amount must be >= 0",
    });
  });

  it("rejects invalid originating_country", async () => {
    await expect(
      createTransaction({ ...baseInput, originating_country: "USA" }, "org-1")
    ).rejects.toMatchObject({ message: expect.stringMatching(/originating_country/) });
  });

  it("rejects invalid destination_country", async () => {
    await expect(
      createTransaction({ ...baseInput, destination_country: "D" }, "org-1")
    ).rejects.toMatchObject({ message: expect.stringMatching(/destination_country/) });
  });

  it("creates with classification_status pending, normalized ISO countries, and default source_system", async () => {
    await createTransaction(baseInput, "org-1");
    expect(Transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org-1",
        transaction_type: "sale",
        amount: 100,
        currency: "USD",
        originating_country: "US",
        destination_country: "DE",
        classification_status: "pending",
        source_system: "manual",
      })
    );
  });
});

describe("listTransactions", () => {
  it("rejects when orgId missing", async () => {
    await expect(listTransactions(null, {})).rejects.toMatchObject({ message: "org_id is required" });
  });

  it("paginates and sorts", async () => {
    Transaction.countDocuments.mockResolvedValue(30);
    const lean = jest.fn().mockResolvedValue([{ _id: "1" }]);
    const q = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ lean }),
    };
    Transaction.find.mockReturnValue(q);

    const result = await listTransactions("org-1", { page: "2", limit: "10", sortBy: "amount", sortOrder: "asc" });

    expect(Transaction.find).toHaveBeenCalledWith({ org_id: "org-1" });
    expect(q.sort).toHaveBeenCalledWith({ amount: 1 });
    expect(result.pagination.page).toBe(2);
    expect(result.pagination.totalPages).toBe(3);
    expect(result.data).toEqual([{ _id: "1" }]);
  });
});

describe("getTransactionById", () => {
  it("returns 404 when not found", async () => {
    Transaction.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    await expect(getTransactionById("id", "org-1")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns 403 when org mismatch", async () => {
    Transaction.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ org_id: "other" }) });
    await expect(getTransactionById("id", "org-1")).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe("classifyTransaction", () => {
  it("rejects invalid status", async () => {
    await expect(classifyTransaction("id", "pending", "org-1")).rejects.toMatchObject({ statusCode: 400 });
  });

  it("returns 404 when not found", async () => {
    Transaction.findById.mockResolvedValue(null);
    await expect(classifyTransaction("id", "classified", "org-1")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("returns 403 on org mismatch", async () => {
    const save = jest.fn();
    Transaction.findById.mockResolvedValue({ org_id: "other", save });
    await expect(classifyTransaction("id", "classified", "org-1")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("updates status and save for same org", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const doc = { org_id: "org-1", classification_status: "pending", save };
    Transaction.findById.mockResolvedValue(doc);
    await classifyTransaction("id", "rejected", "org-1");
    expect(doc.classification_status).toBe("rejected");
    expect(doc.classified_at).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalled();
  });
});
