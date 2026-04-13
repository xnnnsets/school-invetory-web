import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, RefreshCw, X } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";
import { ModalPanel } from "../components/Motion.jsx";

function statusPill(status) {
  const map = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
    FULFILLED: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const label = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    FULFILLED: "Dipenuhi",
  }[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${map[status] || ""}`}>
      {label || status}
    </span>
  );
}

export default function Requests() {
  const user = getUser();
  const isGuru = user?.role === "GURU";
  const canProcess = user?.role === "ADMIN" || user?.role === "PETUGAS_TU";

  const [items, setItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState([{ itemId: "", qty: 1 }]);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [r, i] = await Promise.all([apiFetch(isGuru ? "/api/requests?mine=1" : "/api/requests"), apiFetch("/api/items")]);
      setRows(r.data);
      setItems(i.data);
      setLines([{ itemId: i.data?.[0]?.id || "", qty: 1 }]);
    } catch (e) {
      setError(e?.message || "Gagal memuat permintaan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/requests", { method: "POST", body: { note: note || undefined, lines } });
      setOpen(false);
      setNote("");
      await load();
    } catch (e) {
      setError(e?.message || "Gagal mengajukan");
    } finally {
      setSaving(false);
    }
  }

  async function action(id, type) {
    setError("");
    try {
      await apiFetch(`/api/requests/${id}/${type}`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal memproses");
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Permintaan Barang</div>
      <div className="text-sm text-slate-600">{isGuru ? "Ajukan permintaan barang ke TU." : "Proses permintaan barang dari guru."}</div>

      <div className="mt-5 flex flex-col md:flex-row gap-2">
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </button>
        {isGuru ? (
          <button className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800" onClick={() => setOpen(true)}>
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Ajukan
            </span>
          </button>
        ) : null}
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Cari pemohon / status / barang..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-3 py-2">Waktu</th>
              <th className="text-left font-medium px-3 py-2">Pemohon</th>
              <th className="text-left font-medium px-3 py-2">Barang</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
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
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 align-top">
                  <td className="px-3 py-2 text-xs text-slate-600">{new Date(r.requestedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.requester?.name || "-"}</div>
                    <div className="text-xs text-slate-500">{r.requester?.email || ""}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {(r.lines || []).map((x) => (
                        <div key={x.id} className="text-xs">
                          <span className="font-medium">{x.item?.name}</span>{" "}
                          <span className="text-slate-500">× {x.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">{statusPill(r.status)}</td>
                  <td className="px-3 py-2 text-right">
                    {canProcess ? (
                      <div className="inline-flex gap-2">
                        {r.status === "PENDING" ? (
                          <>
                            <button className="rounded-lg bg-emerald-600 text-white px-2 py-1 text-xs hover:bg-emerald-500" onClick={() => action(r.id, "approve")}>
                              Approve
                            </button>
                            <button className="rounded-lg bg-rose-600 text-white px-2 py-1 text-xs hover:bg-rose-500" onClick={() => action(r.id, "reject")}>
                              Reject
                            </button>
                          </>
                        ) : null}
                        {r.status === "APPROVED" ? (
                          <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-white" onClick={() => action(r.id, "fulfill")}>
                            Fulfill
                          </button>
                        ) : null}
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
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5 mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Ajukan Permintaan</div>
                  <div className="text-sm text-slate-600">Pilih barang dan jumlah yang dibutuhkan.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 inline-flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Catatan (opsional)
                  </label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Misal: untuk kegiatan lomba / habis pakai" />
                </div>

                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-sm font-semibold">Detail</div>
                  <div className="mt-2 space-y-3">
                    {lines.map((ln, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-8">
                          <label className="text-xs font-medium text-slate-600">Barang</label>
                          <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={ln.itemId} onChange={(e) => setLines((arr) => arr.map((x, i) => (i === idx ? { ...x, itemId: e.target.value } : x)))}>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} (stok: {it.stock})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="text-xs font-medium text-slate-600">Qty</label>
                          <input type="number" min="1" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={ln.qty} onChange={(e) => setLines((arr) => arr.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))} />
                        </div>
                        <div className="col-span-1">
                          <button className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm hover:bg-slate-50" onClick={() => setLines((arr) => arr.filter((_, i) => i !== idx))} disabled={lines.length === 1} title="Hapus baris">
                            −
                          </button>
                        </div>
                      </div>
                    ))}

                    <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={() => setLines((arr) => [...arr, { itemId: items?.[0]?.id || "", qty: 1 }])}>
                      + Tambah Baris
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                  Batal
                </button>
                <button disabled={saving} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60" onClick={submit}>
                  {saving ? "Mengirim..." : "Ajukan"}
                </button>
              </div>
            </div>
          </ModalPanel>
        </div>
      ) : null}
    </div>
  );
}

