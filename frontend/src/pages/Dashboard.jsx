import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bell, Boxes, Download, FileText, Handshake, TrendingUp, TriangleAlert } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

function Card({ icon: Icon, color, value, label, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-2xl ${color} text-white flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          <div className="text-sm text-slate-600">{label}</div>
          {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function Dashboard() {
  const user = getUser();
  const isGuru = user?.role === "GURU";
  const isAdmin = user?.role === "ADMIN";
  const isKepsek = user?.role === "KEPALA_SEKOLAH";
  const isTU = user?.role === "PETUGAS_TU";

  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [stockByCategory, setStockByCategory] = useState([]);
  const [activity, setActivity] = useState([]);
  const [items, setItems] = useState([]);
  const [loans, setLoans] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notificationsMeta, setNotificationsMeta] = useState({ unread: 0 });
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      if (isGuru) {
        const [l, r] = await Promise.all([apiFetch("/api/loans"), apiFetch("/api/requests?mine=1")]);
        setLoans(l.data);
        setRequests(r.data);
        return;
      }

      const [s, t, b, a, i, n] = await Promise.all([
        apiFetch("/api/dashboard/summary"),
        apiFetch("/api/dashboard/trends"),
        apiFetch("/api/dashboard/stock-by-category"),
        apiFetch("/api/dashboard/recent-activity"),
        apiFetch("/api/items"),
        isKepsek ? apiFetch("/api/notifications") : Promise.resolve({ meta: { unread: 0 }, data: [] }),
      ]);
      setSummary(s.data);
      setTrends(t.data);
      setStockByCategory(b.data);
      setActivity(a.data);
      setItems(i.data);
      setNotificationsMeta({ unread: n?.meta?.unread || 0 });
    } catch (e) {
      setError(e?.message || "Gagal memuat dashboard");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lowStockList = useMemo(
    () => items.filter((x) => (x.minStock || 0) > 0 && x.stock <= x.minStock).slice(0, 6),
    [items],
  );

  if (isGuru) {
    const activeLoans = loans.filter((x) => x.status === "APPROVED").length;
    const processingRequests = requests.filter((x) => x.status === "PENDING" || x.status === "APPROVED").length;
    const totalHistory = loans.length + requests.length;

    return (
      <div className="max-w-6xl">
        <div className="mb-1 text-2xl font-semibold">Dashboard</div>
        <div className="text-sm text-slate-600">Ringkasan peminjaman dan permintaan barang</div>
        {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-5 grid md:grid-cols-3 gap-4">
          <Card icon={Boxes} color="bg-slate-900" value={activeLoans} label="Peminjaman Aktif" hint="Sedang dipinjam" />
          <Card
            icon={TrendingUp}
            color="bg-amber-500"
            value={processingRequests}
            label="Permintaan Diproses"
            hint="Menunggu/Disetujui"
          />
          <Card icon={Download} color="bg-emerald-600" value={totalHistory} label="Riwayat" hint="Total permintaan & peminjaman" />
        </div>

        <div className="mt-5">
          <Panel title="Peminjaman Aktif">
            <div className="space-y-2">
              {loans
                .filter((x) => x.status === "APPROVED")
                .slice(0, 6)
                .map((x) => (
                  <div key={x.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                    <div className="text-sm">
                      <div className="font-medium">{x.lines?.[0]?.item?.name || "Peminjaman"}</div>
                      <div className="text-xs text-slate-500">Diajukan: {new Date(x.requestedAt).toLocaleDateString()}</div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">
                      Aktif
                    </span>
                  </div>
                ))}
              {!loans.some((x) => x.status === "APPROVED") ? (
                <div className="text-sm text-slate-500">Belum ada peminjaman aktif.</div>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  const trendLabels = trends.map((x) => x.bucket);
  const lineData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Barang Masuk",
        data: trends.map((x) => x.inboundQty),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        tension: 0.35,
      },
      {
        label: "Barang Keluar",
        data: trends.map((x) => x.outboundQty),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        tension: 0.35,
      },
    ],
  };

  const barData = {
    labels: stockByCategory.map((x) => x.categoryName),
    datasets: [
      {
        label: "Stok",
        data: stockByCategory.map((x) => x.stock),
        backgroundColor: "#3b82f6",
        borderRadius: 10,
      },
    ],
  };

  const headerSubtitle = isAdmin
    ? "Ringkasan inventaris dan aktivitas terkini"
    : isKepsek
      ? "Monitoring stok, aktivitas, dan notifikasi"
      : isTU
        ? "Ringkasan operasional harian (masuk/keluar, permintaan, peminjaman)"
        : "Ringkasan inventaris";

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Dashboard</div>
      <div className="text-sm text-slate-600">{headerSubtitle}</div>
      {error ? <div className="mt-3 text-sm text-rose-700">{error}</div> : null}

      {isTU ? (
        <div className="mt-5 grid md:grid-cols-4 gap-4">
          <Card icon={TrendingUp} color="bg-emerald-600" value={summary?.inboundToday ?? "-"} label="Barang Masuk" hint="Hari ini" />
          <Card icon={Download} color="bg-orange-500" value={summary?.outboundToday ?? "-"} label="Barang Keluar" hint="Hari ini" />
          <Card icon={FileText} color="bg-amber-500" value={summary?.pendingRequests ?? "-"} label="Permintaan" hint="Menunggu" />
          <Card icon={Handshake} color="bg-blue-600" value={summary?.pendingLoans ?? "-"} label="Peminjaman" hint="Menunggu" />
        </div>
      ) : (
        <div className="mt-5 grid md:grid-cols-4 gap-4">
          <Card icon={Boxes} color="bg-blue-600" value={summary?.totalItems ?? "-"} label="Total Barang" hint="Semua item" />
          <Card icon={TrendingUp} color="bg-emerald-600" value={summary?.inboundThisMonthQty ?? "-"} label="Barang Masuk" hint="Bulan ini" />
          <Card icon={Download} color="bg-orange-500" value={summary?.outboundThisMonthQty ?? "-"} label="Barang Keluar" hint="Bulan ini" />
          <Card icon={TriangleAlert} color="bg-rose-600" value={summary?.lowStockItems ?? "-"} label="Stok Menipis" hint="Perlu restok" />
        </div>
      )}

      {!isTU ? (
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          <Panel title="Trend Barang Masuk & Keluar">
            <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Panel>
          <Panel title="Stok per Kategori">
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Panel>
        </div>
      ) : (
        <div className="mt-5 grid lg:grid-cols-2 gap-4">
          <Panel title="Stok Menipis (Prioritas)">
            <div className="space-y-2">
              {lowStockList.map((it) => (
                <div key={it.id} className="rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-rose-700">
                      {it.stock} / min: {it.minStock}
                    </div>
                  </div>
                </div>
              ))}
              {!lowStockList.length ? <div className="text-sm text-slate-500">Stok aman.</div> : null}
            </div>
          </Panel>
          <Panel title="Aktivitas Terbaru">
            <div className="space-y-2">
              {activity.slice(0, 6).map((a, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {a.type === "INBOUND"
                        ? "Barang Masuk"
                        : a.type === "OUTBOUND"
                          ? "Barang Keluar"
                          : a.type === "REQUEST"
                            ? "Permintaan"
                            : "Peminjaman"}
                    </div>
                    <div className="text-xs text-slate-500">{new Date(a.at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {!activity.length ? <div className="text-sm text-slate-500">Belum ada aktivitas.</div> : null}
            </div>
          </Panel>
        </div>
      )}

      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        <Panel title="Aktivitas Terbaru">
          <div className="space-y-2">
            {activity.slice(0, 6).map((a, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {a.type === "INBOUND"
                      ? "Barang Masuk"
                      : a.type === "OUTBOUND"
                        ? "Barang Keluar"
                        : a.type === "REQUEST"
                          ? "Permintaan"
                          : "Peminjaman"}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(a.at).toLocaleString()}</div>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {(a.items || []).slice(0, 1).map((it) => (
                    <span key={it.name}>
                      {it.name} × {it.qty}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {!activity.length ? <div className="text-sm text-slate-500">Belum ada aktivitas.</div> : null}
          </div>
        </Panel>

        <Panel title={isKepsek ? `Notifikasi (Unread: ${notificationsMeta.unread})` : "Stok Menipis"}>
          {isKepsek ? (
            <div className="text-sm text-slate-600">
              Notifikasi terbaru bisa dilihat di menu <span className="font-medium">Notifikasi</span>. Unread saat ini:{" "}
              <span className="font-semibold text-slate-900">{notificationsMeta.unread}</span>.
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700">
                <Bell className="h-4 w-4" /> Cek Notifikasi untuk detail
              </div>
            </div>
          ) : (
          <div className="space-y-2">
            {lowStockList.map((it) => (
              <div key={it.id} className="rounded-xl border border-slate-200 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{it.name}</div>
                  <div className="text-xs text-rose-700">
                    {it.stock} / min: {it.minStock}
                  </div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-rose-100">
                  <div
                    className="h-2 rounded-full bg-rose-500"
                    style={{
                      width: `${Math.min(100, Math.round((it.stock / Math.max(1, it.minStock)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!lowStockList.length ? <div className="text-sm text-slate-500">Stok aman.</div> : null}
          </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

