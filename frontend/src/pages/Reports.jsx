import { useEffect, useMemo, useState } from "react";
import { Filter, Printer, RefreshCw } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm transition ${
        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function Reports() {
  const user = getUser();
  const [tab, setTab] = useState("stock");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");

  const title = useMemo(() => {
    const map = {
      stock: "Laporan Stok",
      inbound: "Laporan Barang Masuk",
      outbound: "Laporan Barang Keluar",
      loans: "Laporan Peminjaman",
      requests: "Laporan Permintaan",
    };
    return map[tab] || "Laporan";
  }, [tab]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", new Date(from).toISOString());
      if (to) qs.set("to", new Date(to).toISOString());
      if (status) qs.set("status", status);
      const url = qs.toString() ? `/api/reports/${tab}?${qs}` : `/api/reports/${tab}`;
      const res = await apiFetch(url);
      setRows(res.data);
    } catch (e) {
      setError(e?.message || "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const showFilters = tab !== "stock";
  const showStatus = tab === "loans" || tab === "requests";

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Laporan</div>
      <div className="text-sm text-slate-600">
        {user?.role === "GURU" ? "Kamu hanya melihat laporan milik sendiri." : "Filter dan cetak laporan sesuai kebutuhan."}
      </div>

      <div className="mt-5 flex flex-col lg:flex-row lg:items-center gap-2">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
          <TabButton active={tab === "stock"} onClick={() => setTab("stock")}>
            Stok
          </TabButton>
          <TabButton active={tab === "inbound"} onClick={() => setTab("inbound")}>
            Masuk
          </TabButton>
          <TabButton active={tab === "outbound"} onClick={() => setTab("outbound")}>
            Keluar
          </TabButton>
          <TabButton active={tab === "loans"} onClick={() => setTab("loans")}>
            Peminjaman
          </TabButton>
          <TabButton active={tab === "requests"} onClick={() => setTab("requests")}>
            Permintaan
          </TabButton>
        </div>

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
      </div>

      {showFilters ? (
        <div className="mt-4 grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 md:col-span-3">
            <label className="text-xs font-medium text-slate-600 inline-flex items-center gap-2">
              <Filter className="h-4 w-4" /> Dari tanggal
            </label>
            <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="col-span-12 md:col-span-3">
            <label className="text-xs font-medium text-slate-600">Sampai tanggal</label>
            <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {showStatus ? (
            <div className="col-span-12 md:col-span-3">
              <label className="text-xs font-medium text-slate-600">Status</label>
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">(Semua)</option>
                {tab === "loans" ? (
                  <>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="RETURNED">RETURNED</option>
                  </>
                ) : (
                  <>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="FULFILLED">FULFILLED</option>
                  </>
                )}
              </select>
            </div>
          ) : null}
          <div className="col-span-12 md:col-span-3 flex gap-2">
            <button className="mt-6 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
              Terapkan
            </button>
            <button
              className="mt-6 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => {
                setFrom("");
                setTo("");
                setStatus("");
                setTimeout(load, 0);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 print:p-0 print:border-0 print:shadow-none">
        <div className="mb-3">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-slate-500">Dihasilkan: {new Date().toLocaleString()}</div>
        </div>

        {tab === "stock" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 print:border-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 print:bg-white">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Kode</th>
                  <th className="text-left font-medium px-3 py-2">Nama</th>
                  <th className="text-left font-medium px-3 py-2">Kategori</th>
                  <th className="text-right font-medium px-3 py-2">Stok</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">Memuat...</td>
                  </tr>
                ) : rows.length ? (
                  rows.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{it.code}</td>
                      <td className="px-3 py-2 font-medium">{it.name}</td>
                      <td className="px-3 py-2 text-slate-600">{it.category?.name || "-"}</td>
                      <td className="px-3 py-2 text-right">{it.stock}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">Tidak ada data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 print:border-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 print:bg-white">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Waktu</th>
                  <th className="text-left font-medium px-3 py-2">Catatan</th>
                  <th className="text-left font-medium px-3 py-2">Detail</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">Memuat...</td>
                  </tr>
                ) : rows.length ? (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2 text-xs text-slate-600">{new Date(r.date || r.requestedAt).toLocaleString()}</td>
                      <td className="px-3 py-2 text-slate-700">{r.note || "-"}</td>
                      <td className="px-3 py-2">
                        {(r.lines || []).map((ln) => (
                          <div key={ln.id} className="text-xs">
                            <span className="font-medium">{ln.item?.name}</span> <span className="text-slate-500">× {ln.qty}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-3 py-2 text-xs">{r.status ? r.status : "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">Tidak ada data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

