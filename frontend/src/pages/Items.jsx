import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Printer, RefreshCw, X } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";
import { ModalPanel, Page } from "../components/Motion.jsx";

function canManage(role) {
  return role === "ADMIN" || role === "PETUGAS_TU";
}

export default function Items() {
  const user = getUser();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create item modal state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", categoryId: "", unit: "unit", minStock: 0, roomId: "" });
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [i, c, r] = await Promise.all([apiFetch("/api/items"), apiFetch("/api/categories"), apiFetch("/api/rooms")]);
      setItems(i.data);
      setCategories(c.data);
      setRooms(r.data);
      setForm((f) => ({ ...f, categoryId: c.data?.[0]?.id || "", roomId: r.data?.[0]?.id || "" }));
    } catch (e) {
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => `${it.code} ${it.name} ${it.category?.name || ""}`.toLowerCase().includes(q));
  }, [items, query]);

  async function onCreate() {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/items", {
        method: "POST",
        body: { ...form, roomId: form.roomId || null },
      });
      setOpen(false);
      setForm({ code: "", name: "", categoryId: categories?.[0]?.id || "", unit: "unit", minStock: 0, roomId: rooms?.[0]?.id || "" });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate() {
    if (!edit) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/items/${edit.id}`, {
        method: "PUT",
        body: { ...edit, roomId: edit.roomId || null },
      });
      setEdit(null);
      await load();
    } catch (e) {
      setError(e?.message || "Gagal memperbarui");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Data Barang</div>
      <div className="text-sm text-slate-600">Kelola master barang dan monitoring stok.</div>

      <div className="mt-5 flex flex-col md:flex-row gap-2">
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={() => window.print()}>
          <span className="inline-flex items-center gap-2">
            <Printer className="h-4 w-4" /> Cetak
          </span>
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load} disabled={loading}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </button>
        {canManage(user?.role) ? (
          <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800" onClick={() => setOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Tambah
            </span>
          </button>
        ) : null}
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Cari kode/nama/kategori..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Page>
        <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Kode</th>
                  <th className="text-left font-medium px-3 py-2">Nama</th>
                  <th className="text-left font-medium px-3 py-2">Kategori</th>
                  <th className="text-right font-medium px-3 py-2">Stok</th>
                  <th className="text-right font-medium px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      Memuat...
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">{it.code}</td>
                      <td className="px-3 py-2 font-medium">{it.name}</td>
                      <td className="px-3 py-2 text-slate-600">{it.category?.name || "-"}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${
                            it.minStock && it.stock <= it.minStock
                              ? "bg-rose-50 text-rose-700 ring-rose-200"
                              : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          }`}
                        >
                          {it.stock}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canManage(user?.role) ? (
                          <button
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() =>
                              setEdit({
                                id: it.id,
                                code: it.code,
                                name: it.name,
                                categoryId: it.categoryId,
                                unit: it.unit,
                                minStock: it.minStock,
                                roomId: it.roomId || "",
                              })
                            }
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      Tidak ada data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-600 to-cyan-500 text-white p-4">
            <div className="text-xs opacity-90">Total Item</div>
            <div className="mt-1 text-3xl font-semibold">{items.length}</div>
            <div className="mt-2 text-xs opacity-90">
              Tip: gunakan fitur cetak untuk laporan stok sederhana.
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold">Kategori</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.length ? (
                categories.map((c) => (
                  <span key={c.id} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {c.name}
                  </span>
                ))
              ) : (
                <div className="text-xs text-slate-500">Belum ada kategori.</div>
              )}
            </div>
          </div>
        </div>
        </div>

      {open ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Tambah Barang</div>
                  <div className="text-sm text-slate-600">Akan muncul di master stok.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Kode</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="BRG-001"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Nama</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Laptop / Kursi / Proyektor"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Kategori</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Satuan</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="unit/rim/buah"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Min Stok</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={form.minStock}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Ruangan</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                  value={form.roomId}
                  onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                >
                  <option value="">(Tidak ditentukan)</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                Batal
              </button>
              <button
                disabled={saving}
                className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                onClick={onCreate}
              >
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
                  <div className="text-lg font-semibold">Edit Barang</div>
                  <div className="text-sm text-slate-600">Perubahan tersimpan ke master data.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setEdit(null)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Kode</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.code} onChange={(e) => setEdit((x) => ({ ...x, code: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Nama</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.name} onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Kategori</label>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={edit.categoryId} onChange={(e) => setEdit((x) => ({ ...x, categoryId: e.target.value }))}>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Satuan</label>
                    <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.unit} onChange={(e) => setEdit((x) => ({ ...x, unit: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Min Stok</label>
                    <input type="number" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={edit.minStock} onChange={(e) => setEdit((x) => ({ ...x, minStock: Number(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Ruangan</label>
                  <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={edit.roomId} onChange={(e) => setEdit((x) => ({ ...x, roomId: e.target.value }))}>
                    <option value="">(Tidak ditentukan)</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setEdit(null)}>Batal</button>
                <button disabled={saving} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={onUpdate}>
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </ModalPanel>
        </div>
      ) : null}
      </Page>
    </div>
  );
}

