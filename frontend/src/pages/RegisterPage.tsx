import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authBackground from "../assets/auth-bg.png";
import taxLogo from "../assets/tax.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    legal_name: "",
    entity_type: "",
    country_of_incorporation: "",
    tax_identification_number: "",
    full_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        organization: {
          legal_name: form.legal_name,
          entity_type: form.entity_type,
          country_of_incorporation: form.country_of_incorporation.toUpperCase(),
          tax_identification_number: form.tax_identification_number || undefined,
        },
        user: {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: "admin",
        },
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#dc6900]";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 relative bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${authBackground})` }}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative z-10 w-full max-w-xl bg-white/85 backdrop-blur-sm border border-white/40 rounded-xl shadow-sm p-8">
        <div className="mb-5 flex justify-center">
          <div className="w-full max-w-[220px] rounded-lg bg-white/85 px-3 py-2 border border-gray-200/70">
            <img src={taxLogo} alt="Aether Tax" className="h-12 w-full object-contain" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Create your organization</h1>
        <p className="text-sm text-gray-500 mt-1">Register your admin account to start using Aether Tax.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Organization Legal Name</label>
              <input
                value={form.legal_name}
                onChange={(e) => setForm((prev) => ({ ...prev, legal_name: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Entity Type</label>
              <input
                value={form.entity_type}
                onChange={(e) => setForm((prev) => ({ ...prev, entity_type: e.target.value }))}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Country (2-letter)</label>
              <input
                value={form.country_of_incorporation}
                onChange={(e) => setForm((prev) => ({ ...prev, country_of_incorporation: e.target.value }))}
                minLength={2}
                maxLength={2}
                required
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">Tax Identification Number</label>
              <input
                value={form.tax_identification_number}
                onChange={(e) => setForm((prev) => ({ ...prev, tax_identification_number: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-800 mb-3">Admin user</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  minLength={8}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[#dc6900] hover:bg-[#eb8c00] transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-[#dc6900] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
