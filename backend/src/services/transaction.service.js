const Transaction = require("../models/Transaction");
const { createServiceError } = require("../utils/serviceError");

function validateCountryCode(code) {
  return typeof code === "string" && /^[A-Z]{2}$/.test(code.toUpperCase());
}

async function createTransaction(input, orgId) {
  if (!orgId) {
    throw createServiceError("org_id is required", 400);
  }

  const {
    source_system,
    transaction_type,
    amount,
    currency,
    originating_country,
    destination_country,
    is_intercompany,
    transaction_date,
    notes,
  } = input;

  if (!transaction_type) throw createServiceError("transaction_type is required", 400);
  if (amount === undefined || amount === null || amount < 0) throw createServiceError("amount must be >= 0", 400);
  if (!currency) throw createServiceError("currency is required", 400);
  if (!originating_country || !validateCountryCode(originating_country)) {
    throw createServiceError("originating_country must be a valid 2-char ISO code", 400);
  }
  if (!destination_country || !validateCountryCode(destination_country)) {
    throw createServiceError("destination_country must be a valid 2-char ISO code", 400);
  }

  const transaction = await Transaction.create({
    source_system: source_system || "manual",
    org_id: orgId,
    transaction_type,
    amount,
    currency: currency || "USD",
    originating_country: originating_country.toUpperCase(),
    destination_country: destination_country.toUpperCase(),
    is_intercompany: Boolean(is_intercompany),
    transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
    classification_status: "pending",
    notes,
  });

  return transaction;
}

async function listTransactions(orgId, query) {
  if (!orgId) {
    throw createServiceError("org_id is required", 400);
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const filter = { org_id: orgId };
  const total = await Transaction.countDocuments(filter);
  const data = await Transaction.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getTransactionById(id, orgId) {
  const transaction = await Transaction.findById(id).lean();
  if (!transaction) {
    throw createServiceError("Transaction not found", 404);
  }
  if (orgId && transaction.org_id !== orgId) {
    throw createServiceError("Access denied", 403);
  }
  return transaction;
}

async function classifyTransaction(id, status, orgId) {
  if (!["classified", "rejected"].includes(status)) {
    throw createServiceError("status must be classified or rejected", 400);
  }

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    throw createServiceError("Transaction not found", 404);
  }
  if (orgId && transaction.org_id !== orgId) {
    throw createServiceError("Access denied", 403);
  }

  transaction.classification_status = status;
  transaction.classified_at = new Date();
  await transaction.save();
  return transaction;
}

module.exports = {
  createTransaction,
  listTransactions,
  getTransactionById,
  classifyTransaction,
};
