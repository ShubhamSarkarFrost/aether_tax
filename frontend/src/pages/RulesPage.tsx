import { useEffect, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";
import { createRule, fetchRules, updateRule } from "../api/rules";
import type { JurisdictionRule } from "../api/rules";
import { fetchJurisdictions } from "../api/jurisdictions";
import type { Jurisdiction } from "../api/jurisdictions";
import { fetchSuggestedRuleRate } from "../api/insights";

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc6900]";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

function formatRuleRate(n: number) {
  if (!Number.isFinite(n)) return "0";
  return String(parseFloat(n.toFixed(4)));
}

export default function RulesPage() {
  const [rules, setRules] = useState<JurisdictionRule[]>([]);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestHint, setSuggestHint] = useState<string | null>(null);
  const suggestGen = useRef(0);
  const [form, setForm] = useState({
    jurisdiction_id: "",
    rule_type: "indirect_tax",
    tax_category: "GST",
    standard_rate: "0.05",
    valid_from: new Date().toISOString().slice(0, 10),
    source_reference: "",
    active: true,
  });

  async function load() {
    try {
      const [r, j] = await Promise.all([fetchRules(), fetchJurisdictions()]);
      setRules(r);
      setJurisdictions(j);
      if (!form.jurisdiction_id && j[0]?._id) {
        setForm((prev) => ({ ...prev, jurisdiction_id: j[0]._id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rules");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Auto-suggest rate from Gemini when jurisdiction + tax category (and type) are set
  useEffect(() => {
    const g = ++suggestGen.current;
    const country = jurisdictions.find((j) => j._id === form.jurisdiction_id)?.country_code;
    const cat = form.tax_category.trim();
    if (!country || !cat) {
      setSuggestError(null);
      setSuggestLoading(false);
      setSuggestHint(null);
      return;
    }

    setSuggestError(null);
    const t = window.setTimeout(() => {
      (async () => {
        setSuggestLoading(true);
        setSuggestHint(null);
        try {
          const s = await fetchSuggestedRuleRate({
            country,
            taxCategory: cat,
            ruleType: form.rule_type,
          });
          if (g !== suggestGen.current) return;
          setForm((prev) => ({ ...prev, standard_rate: formatRuleRate(s.standardRate) }));
          setSuggestHint(
            [s.label, s.notes].filter(Boolean).join(" — ") || "Reference suggestion — verify with official rules before filing."
          );
        } catch (e) {
          if (g !== suggestGen.current) return;
          setSuggestError(e instanceof Error ? e.message : "Could not get suggested rate");
        } finally {
          if (g === suggestGen.current) setSuggestLoading(false);
        }
      })();
    }, 600);

    return () => {
      clearTimeout(t);
    };
  }, [form.jurisdiction_id, form.tax_category, form.rule_type, jurisdictions]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRule({
        jurisdiction_id: form.jurisdiction_id,
        rule_type: form.rule_type,
        tax_category: form.tax_category,
        standard_rate: Number(form.standard_rate),
        valid_from: new Date(form.valid_from).toISOString(),
        source_reference: form.source_reference || undefined,
        active: form.active,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    }
  }

  async function toggleActive(rule: JurisdictionRule) {
    try {
      await updateRule(rule._id, { active: !rule.active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rule");
    }
  }

  return (
    <AppLayout title="Jurisdictional Rules">
      <div className="space-y-6">
        <form onSubmit={submit} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Jurisdiction *</label>
            <select className={inputClass} value={form.jurisdiction_id} onChange={(e) => setForm({ ...form, jurisdiction_id: e.target.value })} required>
              {jurisdictions.map((j) => <option key={j._id} value={j._id}>{j.country_code} - {j.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Type *</label>
            <input className={inputClass} placeholder="Rule type" value={form.rule_type} onChange={(e) => setForm({ ...form, rule_type: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <input className={inputClass} placeholder="e.g. GST, VAT, CIT" value={form.tax_category} onChange={(e) => setForm({ ...form, tax_category: e.target.value })} required />
            <p className="text-xs text-gray-500 mt-0.5">When jurisdiction and category are set, the rate is requested from Gemini (reference only).</p>
          </div>
          <div>
            <label className={labelClass}>Rate * (decimal, e.g. 0.18 for 18%)</label>
            <div className="relative">
              <input
                className={`${inputClass} ${suggestLoading ? "pr-9 opacity-90" : ""}`}
                type="number"
                step="0.0001"
                min="0"
                max="1"
                placeholder="Standard rate"
                value={form.standard_rate}
                onChange={(e) => setForm({ ...form, standard_rate: e.target.value })}
                required
                aria-busy={suggestLoading}
              />
              {suggestLoading && (
                <span
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#dc6900] border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
              )}
            </div>
            {suggestError && <p className="text-xs text-amber-700 mt-1">{suggestError}</p>}
            {suggestHint && !suggestError && <p className="text-xs text-gray-600 mt-1">{suggestHint}</p>}
          </div>
          <div>
            <label className={labelClass}>Valid From *</label>
            <input className={inputClass} type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} required />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded-lg text-white font-semibold text-sm px-3 py-2 bg-[#dc6900] hover:bg-[#eb8c00]">Add Rule</button>
          </div>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr>{["Jurisdiction", "Type", "Category", "Rate", "Valid From", "Status", "Action"].map((h) => <th key={h} className="px-4 py-3 text-left text-white" style={{ backgroundColor: "#602320" }}>{h}</th>)}</tr></thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={r._id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-3">{jurisdictions.find((j) => j._id === r.jurisdiction_id)?.country_code || r.jurisdiction_id}</td>
                  <td className="px-4 py-3">{r.rule_type}</td>
                  <td className="px-4 py-3">{r.tax_category}</td>
                  <td className="px-4 py-3">{r.standard_rate}</td>
                  <td className="px-4 py-3">{new Date(r.valid_from).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.active ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3"><button onClick={() => toggleActive(r)} className="text-xs px-2 py-1 rounded bg-[#dc6900] text-white">{r.active ? "Disable" : "Enable"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
