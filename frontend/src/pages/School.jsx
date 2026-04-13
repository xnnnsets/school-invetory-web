import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";

export default function School() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    npsn: "",
    level: "",
    status: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    headmasterName: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/school");
      const s = res.data || {};
      setForm({
        name: s.name || "",
        npsn: s.npsn || "",
        level: s.level || "",
        status: s.status || "",
        address: s.address || "",
        phone: s.phone || "",
        email: s.email || "",
        website: s.website || "",
        headmasterName: s.headmasterName || "",
      });
    } catch (e) {
      setError(e?.message || "Gagal memuat data sekolah");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/school", { method: "PUT", body: form });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Data Sekolah</div>
      <div className="text-sm text-slate-600">Informasi profil sekolah</div>

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="text-sm font-semibold">Informasi Sekolah</div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Nama Sekolah</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">NPSN</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.npsn} onChange={(e) => setForm((f) => ({ ...f, npsn: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Jenjang</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} disabled={loading}>
              <option value="">(Pilih)</option>
              <option value="SD/MI">SD/MI</option>
              <option value="SMP/MTs">SMP/MTs</option>
              <option value="SMA/MA">SMA/MA</option>
              <option value="SMK">SMK</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Status</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} disabled={loading}>
              <option value="">(Pilih)</option>
              <option value="Negeri">Negeri</option>
              <option value="Swasta">Swasta</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Alamat</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Telepon</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Kepala Sekolah</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.headmasterName} onChange={(e) => setForm((f) => ({ ...f, headmasterName: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Website</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} disabled={loading} />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button className="flex-1 rounded-xl bg-blue-600 text-white px-4 py-3 text-sm hover:bg-blue-500 disabled:opacity-60" disabled={saving || loading} onClick={save}>
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button className="rounded-xl border border-slate-200 px-4 py-3 text-sm hover:bg-slate-50" onClick={load} disabled={saving}>
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

