const express = require("express");
const {
  fetchWebTaxReferenceRates,
  suggestJurisdictionRuleRate,
} = require("../services/geminiTaxInsight.service");

const router = express.Router();

/**
 * GET /api/insights/tax-rates?countries=US,DE,IN&asOf=2026-01-01
 * Requires GEMINI_API_KEY. Returns structured reference rates from Gemini (not legal advice).
 */
router.get("/insights/tax-rates", async (req, res) => {
  try {
    const raw = req.query.countries;
    if (!raw || typeof raw !== "string") {
      return res.status(400).json({ success: false, message: "Query 'countries' is required (comma-separated ISO codes, e.g. US,IN)" });
    }
    const countryCodes = raw
      .split(/[,;]/)
      .map((c) => c.trim())
      .filter(Boolean);
    const asOf = typeof req.query.asOf === "string" ? req.query.asOf : undefined;
    const data = await fetchWebTaxReferenceRates(countryCodes, { asOfDate: asOf });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/insights/suggested-rule-rate?country=IN&taxCategory=GST&ruleType=indirect_tax
 * Returns { standardRate } as decimal 0..1 for Jurisdictional Rules form. Requires GEMINI_API_KEY.
 */
router.get("/insights/suggested-rule-rate", async (req, res) => {
  try {
    const country = req.query.country;
    const taxCategory = req.query.taxCategory;
    const ruleType = req.query.ruleType;
    if (typeof country !== "string" || typeof taxCategory !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Query params 'country' and 'taxCategory' are required" });
    }
    const data = await suggestJurisdictionRuleRate({
      countryCode: country,
      taxCategory,
      ruleType: typeof ruleType === "string" ? ruleType : "general",
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

module.exports = router;
