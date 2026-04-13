import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";
import { ModalPanel } from "../components/Motion.jsx";
import { Clock, Eye, Plus, RefreshCw, X } from "lucide-react";

function statusPill(status) {
  const map = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
    RETURNED: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const label = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    RETURNED: "Dikembalikan",
  }[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${map[status] || ""}`}>
      {label || status}
    </span>
  );
}

export default function Loans() {
  const user = getUser();
  const isGuru = user?.role === "GURU";
  const canProcess = user?.role === "ADMIN" || user?.role === "PETUGAS_TU";

  const [items, setItems] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState([{ itemId: "", qty: 1 }]);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("all");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [view, setView] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [l, i] = await Promise.all([apiFetch("/api/loans"), apiFetch("/api/items")]);
      setLoans(l.data);
      setItems(i.data);
      setLines([{ itemId: i.data?.[0]?.id || "", qty: 1 }]);
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
    if (!q) return loans;
    return loans.filter((ln) => {
      const text = [
        ln.requester?.name,
        ln.requester?.email,
        ln.status,
        ...(ln.lines || []).map((x) => x.item?.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [loans, query]);

  const overdueIds = useMemo(() => {
    const now = Date.now();
    const set = new Set();
    for (const ln of loans) {
      if (ln.status === "APPROVED" && ln.dueAt && !ln.returnedAt) {
        if (new Date(ln.dueAt).getTime() < now) set.add(ln.id);
      }
    }
    return set;
  }, [loans]);

  const tabbed = useMemo(() => {
    if (tab === "all") return filtered;
    if (tab === "pending") return filtered.filter((x) => x.status === "PENDING");
    if (tab === "borrowed") return filtered.filter((x) => x.status === "APPROVED" && !overdueIds.has(x.id));
    if (tab === "overdue") return filtered.filter((x) => overdueIds.has(x.id));
    if (tab === "returned") return filtered.filter((x) => x.status === "RETURNED");
    return filtered;
  }, [filtered, tab, overdueIds]);

  async function submitLoan() {
    setSaving(true);
    setError("");
    try {
      await apiFetch("/api/loans", {
        method: "POST",
        body: { lines, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined },
      });
      setOpen(false);
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
      await apiFetch(`/api/loans/${id}/${type}`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal memproses");
    }
  }

  function openView(ln) {
    setView(ln);
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">{isGuru ? "Pinjam Barang" : "Peminjaman Barang"}</div>
      <div className="text-sm text-slate-600">
        {isGuru ? "Ajukan pinjam barang dan pantau statusnya." : "Proses persetujuan dan pengembalian peminjaman."}
      </div>

      <div className="mt-5 flex flex-col md:flex-row gap-2">
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={() => window.print()}>
          Cetak
        </button>
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
          placeholder="Cari nama peminjam / status / barang..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      {!isGuru ? (
        <div className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white p-1">
          <button onClick={() => setTab("all")} className={`rounded-xl px-3 py-2 text-sm ${tab === "all" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}>
            Semua
          </button>
          <button onClick={() => setTab("pending")} className={`rounded-xl px-3 py-2 text-sm ${tab === "pending" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}>
            Menunggu
          </button>
          <button onClick={() => setTab("borrowed")} className={`rounded-xl px-3 py-2 text-sm ${tab === "borrowed" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}>
            Dipinjam
          </button>
          <button onClick={() => setTab("overdue")} className={`rounded-xl px-3 py-2 text-sm ${tab === "overdue" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}>
            Terlambat
          </button>
          <button onClick={() => setTab("returned")} className={`rounded-xl px-3 py-2 text-sm ${tab === "returned" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}>
            Dikembalikan
          </button>
        </div>
      ) : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-3 py-2">Waktu</th>
              <th className="text-left font-medium px-3 py-2">Peminjam</th>
              <th className="text-left font-medium px-3 py-2">Barang</th>
              <th className="text-left font-medium px-3 py-2">Tanggal Pinjam</th>
              <th className="text-left font-medium px-3 py-2">Tanggal Kembali</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
              <th className="text-right font-medium px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                  Memuat...
                </td>
              </tr>
            ) : tabbed.length ? (
              tabbed.map((ln) => (
                <tr key={ln.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {new Date(ln.requestedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{ln.requester?.name || "-"}</div>
                    <div className="text-xs text-slate-500">{ln.requester?.email || ""}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {(ln.lines || []).map((x) => (
                        <div key={x.id} className="text-xs">
                          <span className="font-medium">{x.item?.name}</span>{" "}
                          <span className="text-slate-500">× {x.qty}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{ln.approvedAt ? new Date(ln.approvedAt).toISOString().slice(0, 10) : "-"}</td>
                  <td className="px-3 py-2 text-slate-600 text-xs">{ln.dueAt ? new Date(ln.dueAt).toISOString().slice(0, 10) : "-"}</td>
                  <td className="px-3 py-2">{overdueIds.has(ln.id) ? (
                    <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-700 ring-1 ring-rose-200">
                      Terlambat
                    </span>
                  ) : statusPill(ln.status)}</td>
                  <td className="px-3 py-2 text-right">
                    {canProcess ? (
                      <div className="inline-flex gap-2">
                        <button
                          className="rounded-lg border border-slate-200 p-2 hover:bg-white"
                          title="Lihat"
                          onClick={() => openView(ln)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {ln.status === "PENDING" ? (
                          <>
                            <button
                              className="rounded-lg bg-emerald-600 text-white px-2 py-1 text-xs hover:bg-emerald-500"
                              onClick={() => action(ln.id, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              className="rounded-lg bg-rose-600 text-white px-2 py-1 text-xs hover:bg-rose-500"
                              onClick={() => action(ln.id, "reject")}
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                        {ln.status === "APPROVED" ? (
                          <button
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-white"
                            onClick={() => action(ln.id, "return")}
                          >
                            Return
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
                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
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
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Ajukan Peminjaman</div>
                  <div className="text-sm text-slate-600">Pilih barang dan jumlah yang dibutuhkan.</div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Tanggal Kembali (target)</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
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

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                Batal
              </button>
              <button
                disabled={saving}
                className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                onClick={submitLoan}
              >
                {saving ? "Mengirim..." : "Ajukan"}
              </button>
            </div>
          </div>
          </ModalPanel>
        </div>
      ) : null}

      {view ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <ModalPanel>
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">Detail Peminjaman</div>
                  <div className="text-sm text-slate-600">
                    {view.requester?.name || "-"} • {view.requester?.email || "-"}
                  </div>
                </div>
                <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setView(null)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="mt-1">
                    {overdueIds.has(view.id) ? (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-700 ring-1 ring-rose-200">
                        Terlambat
                      </span>
                    ) : (
                      statusPill(view.status)
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Tanggal Pinjam</div>
                    <div className="mt-1 text-sm font-medium">
                      {view.approvedAt ? new Date(view.approvedAt).toISOString().slice(0, 10) : "-"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">Target Kembali</div>
                    <div className="mt-1 text-sm font-medium">
                      {view.dueAt ? new Date(view.dueAt).toISOString().slice(0, 10) : "-"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-3">
                  <div className="text-sm font-semibold">Barang</div>
                  <div className="mt-2 space-y-1">
                    {(view.lines || []).map((x) => (
                      <div key={x.id} className="text-sm flex items-center justify-between">
                        <div className="font-medium">{x.item?.name || "-"}</div>
                        <div className="text-slate-600">
                          {x.qty} {x.item?.unit || "unit"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {canProcess ? (
                <div className="mt-5 flex justify-end gap-2">
                  <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setView(null)}>
                    Tutup
                  </button>
                  {view.status === "PENDING" ? (
                    <>
                      <button
                        className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-500"
                        onClick={async () => {
                          await action(view.id, "approve");
                          setView(null);
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-xl bg-rose-600 text-white px-3 py-2 text-sm hover:bg-rose-500"
                        onClick={async () => {
                          await action(view.id, "reject");
                          setView(null);
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {view.status === "APPROVED" ? (
                    <button
                      className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-500"
                      onClick={async () => {
                        await action(view.id, "return");
                        setView(null);
                      }}
                    >
                      Kembalikan
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 flex justify-end">
                  <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setView(null)}>
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </ModalPanel>
        </div>
      ) : null}
    </div>
  );
}

