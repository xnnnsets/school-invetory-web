import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { ModalPanel } from "../components/Motion.jsx";

function statusPill(it) {
  const low = (it.minStock || 0) > 0 && it.stock <= it.minStock;
  return low ? (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200">
      Menipis
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
      Aman
    </span>
  );
}

export default function UpdateStock() {
  const [items, setItems] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [delta, setDelta] = useState(1);
  const [mode, setMode] = useState("add"); // add|sub|set
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [i, a] = await Promise.all([apiFetch("/api/items"), apiFetch("/api/stock-adjustments?limit=30")]);
      setItems(i.data);
      setAdjustments(a.data);
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
    return items.filter((it) => `${it.code} ${it.name} ${it.category?.name || ""} ${it.room?.name || ""}`.toLowerCase().includes(q));
  }, [items, query]);

  function openAdjust(it) {
    setSelected(it);
    setMode("add");
    setDelta(1);
    setReason("");
    setOpen(true);
  }

  async function submit() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      let d = Number(delta || 0);
      if (mode === "sub") d = -Math.abs(d);
      if (mode === "add") d = Math.abs(d);
      if (mode === "set") d = Number(delta) - Number(selected.stock);

      await apiFetch("/api/stock-adjustments", {
        method: "POST",
        body: {
          itemId: selected.id,
          delta: Math.trunc(d),
          reason: reason || undefined,
        },
      });
      setOpen(false);
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menyimpan penyesuaian");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Update Stok</div>
      <div className="text-sm text-slate-600">Penyesuaian stok manual dengan jejak audit (operator + alasan).</div>

      <div className="mt-5 flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full text-sm outline-none"
            placeholder="Cari kode/nama/kategori/lokasi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </span>
        </button>
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </button>
      </div>

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-4 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left font-medium px-3 py-2">Kode</th>
                <th className="text-left font-medium px-3 py-2">Nama</th>
                <th className="text-left font-medium px-3 py-2">Stok</th>
                <th className="text-left font-medium px-3 py-2">Lokasi</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-right font-medium px-3 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">Memuat...</td>
                </tr>
              ) : filtered.length ? (
                filtered.slice(0, 50).map((it) => (
                  <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs">{it.code}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-slate-500">{it.category?.name || "-"}</div>
                    </td>
                    <td className="px-3 py-2 text-slate-700">{it.stock} {it.unit}</td>
                    <td className="px-3 py-2 text-slate-600">{it.room?.name || "-"}</td>
                    <td className="px-3 py-2">{statusPill(it)}</td>
                    <td className="px-3 py-2 text-right">
                      <button className="rounded-xl bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-500" onClick={() => openAdjust(it)}>
                        Update
                      </button>
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

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <div className="text-sm font-semibold">Riwayat Penyesuaian</div>
          <div className="mt-3 space-y-2">
            {adjustments.length ? (
              adjustments.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium truncate">{a.item?.name || "-"}</div>
                    <div className={`text-xs ${a.delta > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {a.delta > 0 ? `+${a.delta}` : a.delta} {a.item?.unit || "unit"}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString()} • {a.createdBy?.name || "-"}
                  </div>
                  {a.reason ? <div className="mt-1 text-xs text-slate-600">{a.reason}</div> : null}
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">Belum ada penyesuaian.</div>
            )}
          </div>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Update Stok</div>
                  <div className="text-sm text-slate-600">
                    {selected?.name} • stok saat ini: <span className="font-semibold">{selected?.stock} {selected?.unit}</span>
                  </div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`rounded-xl border px-3 py-2 text-sm ${mode === "add" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50"}`}
                    onClick={() => setMode("add")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Tambah
                    </span>
                  </button>
                  <button
                    className={`rounded-xl border px-3 py-2 text-sm ${mode === "sub" ? "border-rose-600 bg-rose-50 text-rose-700" : "border-slate-200 hover:bg-slate-50"}`}
                    onClick={() => setMode("sub")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Minus className="h-4 w-4" /> Kurangi
                    </span>
                  </button>
                  <button
                    className={`rounded-xl border px-3 py-2 text-sm ${mode === "set" ? "border-slate-900 bg-slate-50 text-slate-900" : "border-slate-200 hover:bg-slate-50"}`}
                    onClick={() => setMode("set")}
                  >
                    Set
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600">{mode === "set" ? "Set stok ke" : "Jumlah"}</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={delta}
                    min={0}
                    onChange={(e) => setDelta(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Alasan (opsional)</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Misal: koreksi stok opname / barang rusak"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={submit}>
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

