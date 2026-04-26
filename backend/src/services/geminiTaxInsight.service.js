const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createServiceError } = require("../utils/serviceError");

const DEFAULT_MODEL = "gemini-2.0-flash";

/**
 * Fetches up-to-date **reference** tax rate intelligence via Gemini. The model may use
 * its training and tools available to the API; always verify with official tax authorities.
 *
 * @param {string[]} countryCodes - ISO 3166-1 alpha-2 codes (e.g. ["US","DE","IN"]).
 * @param {{ asOfDate?: string }} [opts]
 * @returns {Promise<{ model: string, retrievedAt: string, items: object[], rawNote?: string }>}
 */
async function fetchWebTaxReferenceRates(countryCodes, opts = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createServiceError("GEMINI_API_KEY is not configured on the server", 503);
  }

  if (!Array.isArray(countryCodes) || countryCodes.length === 0) {
    throw createServiceError("At least one country code is required", 400);
  }

  const normalized = [...new Set(countryCodes.map((c) => String(c).toUpperCase().trim()).filter(Boolean))].slice(0, 20);

  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const asOf = opts.asOfDate || new Date().toISOString().slice(0, 10);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are a corporate tax research assistant. For each ISO 3166-1 alpha-2 country in this list: ${normalized.join(
    ", "
  )}, provide **commonly cited public statutory or standard rates** (VAT, GST, sales tax, standard corporate income tax, or a major withholding type where relevant) as of ${asOf} or the latest year you are confident about. Use widely referenced public information; if uncertain, set ratePercent to null and explain in "notes". 

Return a single JSON object with this exact structure (no markdown, no code fences, only JSON):
{
  "retrievedAt": "${new Date().toISOString()}",
  "disclaimer": "string — short legal disclaimer that these are non-binding reference figures",
  "items": [
    {
      "countryCode": "US",
      "taxType": "corporate" | "vat" | "gst" | "sales" | "withholding" | "other",
      "label": "short human label, e.g. US federal corporate (headline rate)",
      "ratePercent": 21.0,
      "notes": "one line caveats, optional",
      "sourceHint": "e.g. OECD / local revenue authority (high level, not a URL)"
    }
  ]
}
Include 1–3 rows per country if multiple major taxes apply. Use "ratePercent" as a number (not string). If you cannot list a country, still include a row with notes explaining data gaps.`;

  let text;
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    text = response.text();
  } catch (e) {
    throw createServiceError(e.message || "Gemini request failed", 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_e) {
    throw createServiceError("Gemini response was not valid JSON", 502);
  }

  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw createServiceError("Gemini JSON missing items array", 502);
  }

  const items = parsed.items.map((row) => ({
    countryCode: row.countryCode || row.country_code,
    taxType: row.taxType || row.tax_type,
    label: row.label,
    ratePercent:
      row.ratePercent != null
        ? Number(row.ratePercent)
        : row.rate_percent != null
          ? Number(row.rate_percent)
          : null,
    notes: row.notes,
    sourceHint: row.sourceHint || row.source_hint,
  }));

  return {
    model: modelName,
    retrievedAt: parsed.retrievedAt || new Date().toISOString(),
    disclaimer: parsed.disclaimer || "Reference only — verify with a qualified tax advisor and official sources.",
    items,
  };
}

/**
 * One-shot suggestion for a jurisdictional rule row: maps category + country → decimal rate 0..1
 * to match JurisdictionRule.standard_rate (e.g. 0.18 = 18% GST, 0.21 = 21% corporate).
 */
async function suggestJurisdictionRuleRate({ countryCode, taxCategory, ruleType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw createServiceError("GEMINI_API_KEY is not configured on the server", 503);
  }

  const country = String(countryCode || "")
    .toUpperCase()
    .trim();
  const category = String(taxCategory || "").trim();
  const rType = String(ruleType || "general").trim().toLowerCase();

  if (!/^[A-Z]{2}$/.test(country)) {
    throw createServiceError("country must be a 2-letter ISO code", 400);
  }
  if (!category) {
    throw createServiceError("taxCategory is required", 400);
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const prompt = `For ISO country ${country}, tax rule type (free text) "${rType}", and tax **category/label** "${category}" (e.g. GST, VAT, CIT, WHT, sales tax, Pillar 2, etc.):

Propose a single **commonly cited statutory/standard** rate for that *specific* tax in that country. Use widely referenced public information. If the category is ambiguous, pick the most common headline standard rate and explain in "notes".

Return ONLY a JSON object (no markdown) with this exact shape:
{
  "standardRate": 0.18,
  "label": "short label of what the rate represents",
  "notes": "one line caveats or uncertainty"
}

"standardRate" must be a decimal between 0 and 1 (not percent): e.g. 18% → 0.18, 21% → 0.21, 0% if exempt/no standard rate. If you are unsure, use a best estimate in range and state uncertainty in "notes".`;

  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (e) {
    throw createServiceError(e.message || "Gemini request failed", 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_e) {
    throw createServiceError("Gemini did not return valid JSON", 502);
  }

  let rate = Number(parsed.standardRate ?? parsed.standard_rate);
  if (Number.isNaN(rate)) {
    throw createServiceError("Gemini returned no valid standardRate", 502);
  }
  if (rate > 1) {
    rate = rate / 100;
  }
  if (rate < 0) rate = 0;
  if (rate > 1) rate = 1;

  return {
    model: modelName,
    standardRate: rate,
    label: parsed.label || category,
    notes: parsed.notes || "",
  };
}

module.exports = {
  fetchWebTaxReferenceRates,
  suggestJurisdictionRuleRate,
  DEFAULT_MODEL,
};
