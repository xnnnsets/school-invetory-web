import { useEffect, useMemo, useState } from "react";
import { Box, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
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
  const [confirmDel, setConfirmDel] = useState(null);

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

  async function onDelete() {
    if (!confirmDel) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/api/items/${confirmDel.id}`, { method: "DELETE" });
      setConfirmDel(null);
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menghapus");
    } finally {
      setSaving(false);
    }
  }

  function statusLabel(it) {
    if ((it.minStock || 0) > 0 && it.stock <= it.minStock) return { text: "Menipis", cls: "bg-amber-50 text-amber-800 ring-amber-200" };
    return { text: "Tersedia", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Data Barang</div>
      <div className="text-sm text-slate-600">Kelola data barang inventaris sekolah</div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Box className="h-4 w-4 text-slate-400" />
          <input
            className="w-full text-sm outline-none"
            placeholder="Cari kode atau nama barang..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </span>
        </button>
        {canManage(user?.role) ? (
          <button className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-500" onClick={() => setOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Tambah Barang
            </span>
          </button>
        ) : null}
      </div>

      <Page>
        {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Kode</th>
                  <th className="text-left font-medium px-3 py-2">Nama Barang</th>
                  <th className="text-left font-medium px-3 py-2">Kategori</th>
                  <th className="text-left font-medium px-3 py-2">Stok</th>
                  <th className="text-left font-medium px-3 py-2">Lokasi</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-right font-medium px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                      Memuat...
                    </td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs">{it.code}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Box className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="font-medium">{it.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{it.category?.name || "-"}</td>
                      <td className="px-3 py-2 text-slate-700">{it.stock} {it.unit}</td>
                      <td className="px-3 py-2 text-slate-600">{it.room?.name || "-"}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${statusLabel(it).cls}`}>
                          {statusLabel(it).text}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {canManage(user?.role) ? (
                          <div className="inline-flex gap-2">
                            <button
                              className="rounded-lg border border-slate-200 p-2 hover:bg-white"
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
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100"
                              title="Hapus"
                              onClick={() => setConfirmDel({ id: it.id, name: it.name })}
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
                    <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                      Tidak ada data.
                    </td>
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

      {confirmDel ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="text-lg font-semibold">Hapus Barang</div>
              <div className="mt-2 text-sm text-slate-600">
                Yakin ingin menghapus <span className="font-medium">{confirmDel.name}</span>?
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setConfirmDel(null)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-rose-600 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={onDelete}>
                  {saving ? "Menghapus..." : "Hapus"}
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

