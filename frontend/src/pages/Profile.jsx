import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { setUser } from "../lib/auth.js";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({ name: "", email: "", photoUrl: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  async function load() {
    setLoading(true);
    setError("");
    setOk("");
    try {
      const res = await apiFetch("/api/profile");
      const u = res.data;
      setForm({ name: u.name || "", email: u.email || "", photoUrl: u.photoUrl || "" });
    } catch (e) {
      setError(e?.message || "Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setOk("");
    try {
      const res = await apiFetch("/api/profile", {
        method: "PUT",
        body: {
          name: form.name,
          email: form.email,
          photoUrl: form.photoUrl ? form.photoUrl : null,
        },
      });
      setUser(res.data);
      setOk("Profil berhasil disimpan");
    } catch (e) {
      setError(e?.message || "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setSaving(true);
    setError("");
    setOk("");
    try {
      await apiFetch("/api/profile/password", { method: "PUT", body: pw });
      setPw({ currentPassword: "", newPassword: "" });
      setOk("Password berhasil diubah");
    } catch (e) {
      setError(e?.message || "Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-1 text-2xl font-semibold">Profil Akun</div>
      <div className="text-sm text-slate-600">Kelola data akun dan keamanan.</div>

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}
      {ok ? <div className="mt-3 text-sm text-emerald-700">{ok}</div> : null}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="text-sm font-semibold">Data Akun</div>
        <div className="mt-4 grid gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Nama</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={loading} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Photo URL (opsional)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))} disabled={loading} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-500 disabled:opacity-60" disabled={saving || loading} onClick={saveProfile}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="text-sm font-semibold">Ubah Password</div>
        <div className="mt-4 grid gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600">Password Lama</label>
            <input type="password" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Password Baru</label>
            <input type="password" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60" disabled={saving} onClick={changePassword}>
            {saving ? "Memproses..." : "Ubah Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

