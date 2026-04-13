import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";
import { ModalPanel } from "../components/Motion.jsx";
import { Filter, Plus, Printer, RefreshCw, X } from "lucide-react";

function canManage(role) {
  return role === "ADMIN" || role === "PETUGAS_TU";
}

function formatDateTime(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "-";
  }
}

export default function Transactions({ mode }) {
  const user = getUser();
  const manage = canManage(user?.role);

  const tab = mode;
  const activeLabel = tab === "inbound" ? "Barang Masuk" : "Barang Keluar";

  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState([{ itemId: "", qty: 1 }]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const endpoint = tab === "inbound" ? "/api/inbound" : "/api/outbound";
      const qs = new URLSearchParams();
      if (from) qs.set("from", new Date(from).toISOString());
      if (to) qs.set("to", new Date(to).toISOString());
      const url = qs.toString() ? `${endpoint}?${qs}` : endpoint;
      const [r, i, s] = await Promise.all([
        apiFetch(url),
        apiFetch("/api/items"),
        tab === "inbound" ? apiFetch("/api/suppliers") : Promise.resolve({ data: [] }),
      ]);
      setRows(r.data);
      setItems(i.data);
      setSuppliers(s.data);
      setLines([{ itemId: i.data?.[0]?.id || "", qty: 1 }]);
      setSupplierId(s.data?.[0]?.id || "");
    } catch (e) {
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      const endpoint = tab === "inbound" ? "/api/inbound" : "/api/outbound";
      const body =
        tab === "inbound"
          ? { note: note || undefined, supplierId: supplierId || null, lines }
          : { note: note || undefined, lines };
      await apiFetch(endpoint, { method: "POST", body });
      setOpen(false);
      setNote("");
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menyimpan transaksi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">{activeLabel}</div>
      <div className="text-sm text-slate-600">
        {tab === "inbound" ? "Pencatatan barang masuk (menambah stok)." : "Pencatatan barang keluar (mengurangi stok)."}
      </div>

      <div className="mt-5 flex flex-col md:flex-row gap-2">
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={() => window.print()}>
          <span className="inline-flex items-center gap-2">
            <Printer className="h-4 w-4" /> Cetak
          </span>
        </button>
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
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
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Cari catatan / barang..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

        <div className="mt-3 grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 md:col-span-3">
            <label className="text-xs font-medium text-slate-600 inline-flex items-center gap-2">
              <Filter className="h-4 w-4" /> Dari tanggal
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="text-xs font-medium text-slate-600">Sampai tanggal</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="col-span-12 md:col-span-6 flex gap-2">
            <button
              className="mt-6 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              onClick={load}
            >
              Terapkan Filter
            </button>
            <button
              className="mt-6 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => {
                setFrom("");
                setTo("");
                setTimeout(load, 0);
              }}
            >
              Reset
            </button>
          </div>
        </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-3 py-2">Waktu</th>
              {tab === "inbound" ? <th className="text-left font-medium px-3 py-2">Supplier</th> : null}
              <th className="text-left font-medium px-3 py-2">Catatan</th>
              <th className="text-left font-medium px-3 py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={tab === "inbound" ? 4 : 3} className="px-3 py-6 text-center text-slate-500">
                  Memuat...
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 align-top">
                  <td className="px-3 py-2 text-xs text-slate-600">{formatDateTime(r.date)}</td>
                  {tab === "inbound" ? (
                    <td className="px-3 py-2 text-slate-700">{r.supplier?.name || "-"}</td>
                  ) : null}
                  <td className="px-3 py-2 text-slate-700">{r.note || "-"}</td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {(r.lines || []).map((ln) => (
                        <div key={ln.id} className="text-xs">
                          <span className="font-medium">{ln.item?.name}</span>{" "}
                          <span className="text-slate-500">× {ln.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tab === "inbound" ? 4 : 3} className="px-3 py-6 text-center text-slate-500">
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
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Tambah {activeLabel}</div>
                  <div className="text-sm text-slate-600">Stok akan berubah otomatis setelah disimpan.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

            <div className="mt-4 grid gap-3">
              {tab === "inbound" ? (
                <div>
                  <label className="text-xs font-medium text-slate-600">Supplier</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">(Tanpa supplier)</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div>
                <label className="text-xs font-medium text-slate-600">Catatan</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Misal: pembelian semester 1 / perbaikan lab"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 p-3">
                <div className="text-sm font-semibold">Detail Barang</div>
                <div className="mt-2 space-y-3">
                  {lines.map((ln, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-8">
                        <label className="text-xs font-medium text-slate-600">Barang</label>
                        <select
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                          value={ln.itemId}
                          onChange={(e) =>
                            setLines((arr) => arr.map((x, i) => (i === idx ? { ...x, itemId: e.target.value } : x)))
                          }
                        >
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name} (stok: {it.stock})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-xs font-medium text-slate-600">Qty</label>
                        <input
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          type="number"
                          min="1"
                          value={ln.qty}
                          onChange={(e) =>
                            setLines((arr) =>
                              arr.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)),
                            )
                          }
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm hover:bg-slate-50"
                          onClick={() => setLines((arr) => arr.filter((_, i) => i !== idx))}
                          disabled={lines.length === 1}
                          title="Hapus baris"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => setLines((arr) => [...arr, { itemId: items?.[0]?.id || "", qty: 1 }])}
                  >
                    + Tambah Baris
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                Batal
              </button>
              <button
                disabled={saving}
                className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                onClick={submit}
              >
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

