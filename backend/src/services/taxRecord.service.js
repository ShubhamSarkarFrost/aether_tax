const TaxRecord = require("../models/TaxRecord");
const { createServiceError } = require("../utils/serviceError");

async function listTaxRecords(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const sortBy = query.sortBy || "taxYear";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const filter = {};
  if (query.taxYear) {
    const year = parseInt(query.taxYear, 10);
    if (!Number.isNaN(year)) filter.taxYear = year;
  }
  if (query.entityName) {
    filter.entityName = { $regex: query.entityName, $options: "i" };
  }
  if (query.filingStatus) {
    filter.filingStatus = query.filingStatus;
  }
  if (query.jurisdiction) {
    filter.jurisdiction = { $regex: query.jurisdiction, $options: "i" };
  }

  const total = await TaxRecord.countDocuments(filter);
  const data = await TaxRecord.find(filter)
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

async function createTaxRecord(input) {
  const { taxYear, entityName, taxAmount } = input;
  if (!taxYear || !entityName || taxAmount === undefined) {
    throw createServiceError("taxYear, entityName, and taxAmount are required", 400);
  }
  return TaxRecord.create(input);
}

async function bulkCreateTaxRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw createServiceError("records must be a non-empty array", 400);
  }

  const normalized = records.map((record, index) => {
    const taxYear = Number(record.taxYear);
    const taxAmount = Number(record.taxAmount);
    const entityName = typeof record.entityName === "string" ? record.entityName.trim() : "";

    if (!taxYear || !entityName || Number.isNaN(taxAmount)) {
      throw createServiceError(
        `Invalid record at index ${index}. taxYear, entityName, and taxAmount are required`,
        400
      );
    }

    return {
      ...record,
      taxYear,
      taxAmount,
      entityName,
    };
  });

  return TaxRecord.insertMany(normalized);
}

async function updateTaxRecordFilingStatus(id, filingStatus) {
  const allowedStatuses = ["filed", "pending", "amended", "unfiled"];
  if (!allowedStatuses.includes(filingStatus)) {
    throw createServiceError("Invalid filingStatus", 400);
  }

  const updated = await TaxRecord.findByIdAndUpdate(
    id,
    { filingStatus },
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw createServiceError("Tax record not found", 404);
  }

  return updated;
}

module.exports = {
  listTaxRecords,
  createTaxRecord,
  bulkCreateTaxRecords,
  updateTaxRecordFilingStatus,
};
