import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { fetchMyOrganization, updateMyOrganization } from "../api/organizations";
import type { Organization } from "../api/organizations";

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc6900]";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function SettingsPage() {
  const [form, setForm] = useState({
    legal_name: "",
    entity_type: "",
    country_of_incorporation: "",
    tax_identification_number: "",
    org_tier: "starter",
    is_active: true,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const org = await fetchMyOrganization();
        setForm({
          legal_name: org.legal_name || "",
          entity_type: org.entity_type || "",
          country_of_incorporation: org.country_of_incorporation || "",
          tax_identification_number: org.tax_identification_number || "",
          org_tier: (org.org_tier || "starter") as NonNullable<Organization["org_tier"]>,
          is_active: org.is_active,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load organization");
      }
    }
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await updateMyOrganization({
        ...form,
        country_of_incorporation: form.country_of_incorporation.toUpperCase(),
        org_tier: form.org_tier as NonNullable<Organization["org_tier"]>,
      });
      setMessage("Organization updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <AppLayout title="Organization Profile">
      <div className="flex justify-center">
        <form onSubmit={submit} className="w-full max-w-2xl bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-3xl font-semibold text-gray-900 text-center">Organization Profile</h2>
          <div>
            <label className={labelClass}>Organization Legal Name</label>
            <input className={inputClass} value={form.legal_name} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} placeholder="Legal name" required />
          </div>
          <div>
            <label className={labelClass}>Entity Type</label>
            <input className={inputClass} value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value })} placeholder="Entity type" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Country of Incorporation</label>
              <input className={inputClass} value={form.country_of_incorporation} onChange={(e) => setForm({ ...form, country_of_incorporation: e.target.value })} placeholder="Country code" required />
            </div>
            <div>
              <label className={labelClass}>Tax Identification Number</label>
              <input className={inputClass} value={form.tax_identification_number} onChange={(e) => setForm({ ...form, tax_identification_number: e.target.value })} placeholder="Tax identification number" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Organization Tier</label>
            <select className={inputClass} value={form.org_tier} onChange={(e) => setForm({ ...form, org_tier: e.target.value })}>
              <option value="starter">starter</option>
              <option value="growth">growth</option>
              <option value="enterprise">enterprise</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Organization active
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          <button type="submit" className="rounded-lg text-white font-semibold text-sm px-4 py-2 bg-[#dc6900] hover:bg-[#eb8c00]">Save Changes</button>
        </form>
      </div>
    </AppLayout>
  );
}
