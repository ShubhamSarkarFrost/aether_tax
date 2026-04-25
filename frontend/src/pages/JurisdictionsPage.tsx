import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { createJurisdiction, fetchJurisdictions, updateJurisdiction } from "../api/jurisdictions";
import type { Jurisdiction } from "../api/jurisdictions";

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc6900]";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function JurisdictionsPage() {
  const [items, setItems] = useState<Jurisdiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    country_code: "",
    region_code: "",
    name: "",
    currency: "",
    tax_authority_name: "",
    active: true,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchJurisdictions());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jurisdictions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createJurisdiction(form);
      setForm({ country_code: "", region_code: "", name: "", currency: "", tax_authority_name: "", active: true });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create jurisdiction");
    }
  }

  async function toggleActive(item: Jurisdiction) {
    try {
      await updateJurisdiction(item._id, { active: !item.active });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update jurisdiction");
    }
  }

  return (
    <AppLayout title="Jurisdictions">
      <div className="space-y-6">
        <form onSubmit={submit} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Country Code *</label>
            <input className={inputClass} placeholder="Country code (CA)" value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Region Code (Optional)</label>
            <input className={inputClass} placeholder="Region code (optional)" value={form.region_code} onChange={(e) => setForm({ ...form, region_code: e.target.value })} />
          </div>
          <div>
            <label className={labelClass}>Name *</label>
            <input className={inputClass} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Currency *</label>
            <input className={inputClass} placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} required />
          </div>
          <div>
            <label className={labelClass}>Tax Authority Name</label>
            <input className={inputClass} placeholder="Tax authority name" value={form.tax_authority_name} onChange={(e) => setForm({ ...form, tax_authority_name: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full rounded-lg text-white font-semibold text-sm px-3 py-2 bg-[#dc6900] hover:bg-[#eb8c00]">Add Jurisdiction</button>
          </div>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr>{["Country", "Name", "Currency", "Authority", "Status", "Action"].map((h) => <th key={h} className="px-4 py-3 text-left text-white" style={{ backgroundColor: "#602320" }}>{h}</th>)}</tr></thead>
              <tbody>
                {items.map((j, i) => (
                  <tr key={j._id} className={i % 2 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3">{j.country_code}</td>
                    <td className="px-4 py-3">{j.name}</td>
                    <td className="px-4 py-3">{j.currency}</td>
                    <td className="px-4 py-3">{j.tax_authority_name || "—"}</td>
                    <td className="px-4 py-3">{j.active ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-3"><button onClick={() => toggleActive(j)} className="text-xs px-2 py-1 rounded bg-[#dc6900] text-white">{j.active ? "Disable" : "Enable"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
