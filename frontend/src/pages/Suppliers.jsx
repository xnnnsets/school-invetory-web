import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";
import { ModalPanel } from "../components/Motion.jsx";

function canManage(role) {
  return role === "ADMIN" || role === "PETUGAS_TU";
}

export default function Suppliers() {
  const user = getUser();
  const manage = canManage(user?.role);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [edit, setEdit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/suppliers");
      setRows(res.data);
    } catch (e) {
      setError(e?.message || "Gagal memuat supplier");
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
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  async function create() {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/suppliers", { method: "POST", body: form });
      setOpen(false);
      setForm({ name: "", phone: "", email: "", address: "" });
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
      await apiFetch(`/api/suppliers/${edit.id}`, { method: "PUT", body: edit });
      setEdit(null);
      await load();
    } catch (e) {
      setError(e?.message || "Gagal memperbarui");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirmDel) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/suppliers/${confirmDel.id}`, { method: "DELETE" });
      setConfirmDel(null);
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menghapus");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Data Supplier</div>
      <div className="text-sm text-slate-600">Kelola supplier untuk pencatatan barang masuk.</div>

      <div className="mt-5 flex flex-col md:flex-row gap-2">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Cari supplier..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load} disabled={loading}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </button>
        {manage ? (
          <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800" onClick={() => setOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Tambah
            </span>
          </button>
        ) : null}
      </div>

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nama Supplier</th>
              <th className="text-left font-medium px-3 py-2">Kontak</th>
              <th className="text-left font-medium px-3 py-2">Email</th>
              <th className="text-left font-medium px-3 py-2">Alamat</th>
              <th className="text-right font-medium px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">Memuat...</td>
              </tr>
            ) : filtered.length ? (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2 text-slate-600">{r.phone || "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{r.email || "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{r.address || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {manage ? (
                      <div className="inline-flex gap-2">
                        <button
                          className="rounded-lg border border-slate-200 p-2 hover:bg-white"
                          title="Edit"
                          onClick={() => setEdit({ id: r.id, name: r.name, phone: r.phone || "", email: r.email || "", address: r.address || "" })}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                          title="Hapus"
                          onClick={() => setConfirmDel({ id: r.id, name: r.name })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">Tidak ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Tambah Supplier</div>
                  <div className="text-sm text-slate-600">Opsional isi telepon/alamat.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Nama</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Telepon</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Alamat</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={create}>
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
                  <div className="text-lg font-semibold">Edit Supplier</div>
                  <div className="text-sm text-slate-600">Ubah informasi supplier.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setEdit(null)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Nama</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.name} onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Kontak</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.phone || ""} onChange={(e) => setEdit((x) => ({ ...x, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.email || ""} onChange={(e) => setEdit((x) => ({ ...x, email: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Alamat</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.address || ""} onChange={(e) => setEdit((x) => ({ ...x, address: e.target.value }))} />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setEdit(null)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={update}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </ModalPanel>
        </div>
      ) : null}

      {confirmDel ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="text-lg font-semibold">Hapus Supplier</div>
              <div className="mt-2 text-sm text-slate-600">
                Yakin ingin menghapus <span className="font-medium">{confirmDel.name}</span>?
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setConfirmDel(null)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-rose-600 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={remove}>
                  {saving ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </ModalPanel>
        </div>
      ) : null}
    </div>
  );
}

