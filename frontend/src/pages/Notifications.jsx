import { useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import { apiFetch } from "../lib/api.js";

export default function Notifications() {
  const [rows, setRows] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/notifications");
      setRows(res.data);
      setUnread(res.meta?.unread || 0);
    } catch (e) {
      setError(e?.message || "Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    setError("");
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menandai dibaca");
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-1 text-2xl font-semibold">Notifikasi</div>
      <div className="text-sm text-slate-600">Info stok, transaksi, dan permintaan/peminjaman.</div>

      <div className="mt-5 flex items-center gap-2">
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </button>
        <div className="text-sm text-slate-600">
          Unread: <span className="font-semibold text-slate-900">{unread}</span>
        </div>
      </div>

      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Memuat...</div>
        ) : rows.length ? (
          rows.map((n) => (
            <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold truncate">{n.title}</div>
                    {!n.isRead ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 ring-1 ring-amber-200">
                        Baru
                      </span>
                    ) : null}
                  </div>
                  {n.body ? <div className="mt-1 text-sm text-slate-600">{n.body}</div> : null}
                  <div className="mt-2 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead ? (
                  <button className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50" onClick={() => markRead(n.id)}>
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-4 w-4" /> Tandai dibaca
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Tidak ada notifikasi.</div>
        )}
      </div>
    </div>
  );
}

