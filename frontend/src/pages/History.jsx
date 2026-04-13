import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { apiFetch } from "../lib/api.js";

function pill(status) {
  const map = {
    PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
    RETURNED: "bg-slate-100 text-slate-700 ring-slate-200",
    FULFILLED: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ${map[status] || ""}`}>{status}</span>;
}

export default function History() {
  const [tab, setTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [r, l] = await Promise.all([apiFetch("/api/requests?mine=1"), apiFetch("/api/loans")]);
      setRequests(r.data);
      setLoans(l.data);
    } catch (e) {
      setError(e?.message || "Gagal memuat riwayat");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => (tab === "requests" ? requests : loans), [tab, requests, loans]);

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Riwayat</div>
      <div className="text-sm text-slate-600">Riwayat permintaan dan peminjaman barang.</div>

      <div className="mt-5 flex flex-col md:flex-row gap-2">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setTab("requests")}
            className={`rounded-xl px-3 py-2 text-sm transition ${tab === "requests" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Permintaan
          </button>
          <button
            onClick={() => setTab("loans")}
            className={`rounded-xl px-3 py-2 text-sm transition ${tab === "loans" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"}`}
          >
            Peminjaman
          </button>
        </div>
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </button>
      </div>

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-3 py-2">Waktu</th>
              <th className="text-left font-medium px-3 py-2">Detail</th>
              <th className="text-left font-medium px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">Memuat...</td>
              </tr>
            ) : rows.length ? (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 align-top">
                  <td className="px-3 py-2 text-xs text-slate-600">{new Date(r.requestedAt).toLocaleString()}</td>
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
                  <td className="px-3 py-2">{pill(r.status)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-500">Tidak ada data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

