/**
 * Direct integration test for taxOrchestrator.service (requires MongoDB + seed data).
 *
 * Usage from backend folder:
 *   node scripts/test-tax-orchestrator.js
 *   node scripts/test-tax-orchestrator.js <transactionId>
 *
 * Prereqs:
 * - MONGODB_URI in .env
 * - A Transaction whose destination_country matches an active Jurisdiction
 * - At least one active JurisdictionRule for that jurisdiction
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { runOrchestration } = require("../src/services/taxOrchestrator.service");
const Transaction = require("../src/models/Transaction");

const MONGO = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
  if (!MONGO) {
    console.error("Set MONGODB_URI or MONGO_URI in backend/.env");
    process.exit(1);
  }

  await connectDB(MONGO);

  const argId = process.argv[2];
  let tx;
  if (argId) {
    tx = await Transaction.findById(argId).lean();
    if (!tx) {
      console.error("No transaction with id:", argId);
      process.exit(1);
    }
  } else {
    tx = await Transaction.findOne().sort({ createdAt: -1 }).lean();
    if (!tx) {
      console.error("No transactions in DB. Create one from the app or post to POST /api/transactions");
      process.exit(1);
    }
    console.log("Using latest transaction:", String(tx._id));
  }

  const orgId = tx.org_id;
  console.log("org_id:", orgId, "destination:", tx.destination_country, "type:", tx.transaction_type);

  try {
    const result = await runOrchestration(String(tx._id), orgId, {});
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("runOrchestration failed:", e.message);
    if (e.statusCode) process.exitCode = e.statusCode === 404 ? 1 : 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
