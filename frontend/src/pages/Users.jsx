import { useEffect, useMemo, useState } from "react";
import { Mail, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { ModalPanel } from "../components/Motion.jsx";
import { RoleBadge } from "../components/Badge.jsx";

function statusPill(isActive) {
  return isActive ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
      Aktif
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
      Nonaktif
    </span>
  );
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = (parts[0] || "?")[0];
  const b = (parts[1] || "")[0] || "";
  return (a + b).toUpperCase();
}

function Stat({ color, value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`h-10 w-10 rounded-2xl ${color} text-white flex items-center justify-center`}>
        <Mail className="h-5 w-5" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

export default function Users() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "GURU", password: "" });
  const [edit, setEdit] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/users");
      setRows(res.data);
    } catch (e) {
      setError(e?.message || "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.email} ${r.role}`.toLowerCase().includes(q));
  }, [rows, query]);

  const stats = useMemo(() => {
    const total = rows.length;
    const admin = rows.filter((x) => x.role === "ADMIN").length;
    const guru = rows.filter((x) => x.role === "GURU").length;
    const tu = rows.filter((x) => x.role === "PETUGAS_TU").length;
    return { total, admin, guru, tu };
  }, [rows]);

  async function create() {
    setSaving(true);
    setError("");
    try {
      const body = { ...form, password: form.password || undefined };
      await apiFetch("/api/users", { method: "POST", body });
      setOpen(false);
      setForm({ name: "", email: "", role: "GURU", password: "" });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function update() {
    if (!edit) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/users/${edit.id}`, { method: "PUT", body: edit });
      setEdit(null);
      await load();
    } catch (e) {
      setError(e?.message || "Gagal memperbarui");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id, isActive) {
    setError("");
    try {
      await apiFetch(`/api/users/${id}/status`, { method: "PUT", body: { isActive } });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal mengubah status");
    }
  }

  async function remove(id) {
    setError("");
    try {
      // soft delete = nonaktif (lebih aman)
      await setStatus(id, false);
    } catch (e) {
      setError(e?.message || "Gagal menghapus");
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Kelola Pengguna</div>
          <div className="text-sm text-slate-600">Manajemen pengguna dan hak akses sistem</div>
        </div>
        <button className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-500" onClick={() => setOpen(true)}>
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </span>
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full text-sm outline-none"
            placeholder="Cari nama, email, atau peran..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left font-medium px-3 py-2">Nama</th>
                <th className="text-left font-medium px-3 py-2">Email</th>
                <th className="text-left font-medium px-3 py-2">Peran</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-left font-medium px-3 py-2">Login Terakhir</th>
                <th className="text-right font-medium px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">Memuat...</td>
                </tr>
              ) : filtered.length ? (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-white flex items-center justify-center text-xs font-semibold">
                          {initials(u.name)}
                        </div>
                        <div className="font-medium">{u.name}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{u.email}</td>
                    <td className="px-3 py-2">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-3 py-2">{statusPill(u.isActive)}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          className="rounded-lg border border-slate-200 p-2 hover:bg-white"
                          title="Edit"
                          onClick={() => setEdit({ id: u.id, name: u.name, email: u.email, role: u.role, photoUrl: u.photoUrl || null })}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                          title="Nonaktifkan"
                          onClick={() => remove(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">Tidak ada data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-4 gap-4">
        <Stat color="bg-blue-600" value={stats.total} label="Total Pengguna" />
        <Stat color="bg-indigo-600" value={stats.admin} label="Administrator" />
        <Stat color="bg-orange-500" value={stats.guru} label="Guru" />
        <Stat color="bg-emerald-600" value={stats.tu} label="Petugas TU" />
      </div>

      {open ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Tambah Pengguna</div>
                  <div className="text-sm text-slate-600">Buat akun baru beserta perannya.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Tutup">
                  ×
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Nama</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Peran</label>
                    <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="KEPALA_SEKOLAH">KEPALA_SEKOLAH</option>
                      <option value="PETUGAS_TU">PETUGAS_TU</option>
                      <option value="GURU">GURU</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Password (opsional)</label>
                    <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Kosong = Password123!" />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={create}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </ModalPanel>
        </div>
      ) : null}

      {edit ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Edit Pengguna</div>
                  <div className="text-sm text-slate-600">Ubah nama/email/peran.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setEdit(null)} aria-label="Tutup">
                  ×
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Nama</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.name} onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.email} onChange={(e) => setEdit((x) => ({ ...x, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Peran</label>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={edit.role} onChange={(e) => setEdit((x) => ({ ...x, role: e.target.value }))}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="KEPALA_SEKOLAH">KEPALA_SEKOLAH</option>
                    <option value="PETUGAS_TU">PETUGAS_TU</option>
                    <option value="GURU">GURU</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setEdit(null)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={update}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </ModalPanel>
        </div>
      ) : null}
    </div>
  );
}

