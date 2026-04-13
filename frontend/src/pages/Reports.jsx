import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";

function ReportCard({ iconBg, icon: Icon, title, desc, from, to, setFrom, setTo, onDownload }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-2xl ${iconBg} text-white flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-slate-600">{desc}</div>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-600">Periode</div>
      <div className="mt-1 flex items-center gap-2">
        <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
        <span className="text-slate-400">-</span>
        <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="mt-3 text-xs text-slate-600">Format</div>
      <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
        <option value="pdf">PDF</option>
      </select>

      <button className="mt-4 w-full rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-500" onClick={onDownload}>
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" /> Unduh Laporan
        </span>
      </button>
    </div>
  );
}

export default function Reports() {
  const user = getUser();
  const [tab, setTab] = useState("stock"); // active rendered report table (for print)
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");

  const [fromInbound, setFromInbound] = useState("");
  const [toInbound, setToInbound] = useState("");
  const [fromOutbound, setFromOutbound] = useState("");
  const [toOutbound, setToOutbound] = useState("");
  const [fromLoans, setFromLoans] = useState("");
  const [toLoans, setToLoans] = useState("");

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

  function download(type) {
    if (type === "stock") {
      setTab("stock");
      setTimeout(() => window.print(), 400);
      return;
    }
    if (type === "inbound") {
      setFrom(fromInbound);
      setTo(toInbound);
      setTab("inbound");
      setTimeout(() => window.print(), 500);
      return;
    }
    if (type === "outbound") {
      setFrom(fromOutbound);
      setTo(toOutbound);
      setTab("outbound");
      setTimeout(() => window.print(), 500);
      return;
    }
    if (type === "loans") {
      setFrom(fromLoans);
      setTo(toLoans);
      setStatus("");
      setTab("loans");
      setTimeout(() => window.print(), 500);
      return;
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-1 text-2xl font-semibold">Laporan</div>
      <div className="text-sm text-slate-600">Buat dan unduh laporan inventaris sekolah</div>

      <div className="mt-5 grid lg:grid-cols-2 gap-4">
        <ReportCard
          iconBg="bg-blue-600"
          icon={FileText}
          title="Laporan Stok Barang"
          desc="Daftar lengkap stok barang saat ini dengan detail kategori dan lokasi"
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          onDownload={() => download("stock")}
        />
        <ReportCard
          iconBg="bg-emerald-600"
          icon={FileText}
          title="Laporan Barang Masuk"
          desc="Riwayat barang masuk dengan detail supplier dan tanggal penerimaan"
          from={fromInbound}
          to={toInbound}
          setFrom={setFromInbound}
          setTo={setToInbound}
          onDownload={() => download("inbound")}
        />
        <ReportCard
          iconBg="bg-orange-500"
          icon={FileText}
          title="Laporan Barang Keluar"
          desc="Riwayat barang keluar dengan detail penerima dan tujuan penggunaan"
          from={fromOutbound}
          to={toOutbound}
          setFrom={setFromOutbound}
          setTo={setToOutbound}
          onDownload={() => download("outbound")}
        />
        <ReportCard
          iconBg="bg-purple-600"
          icon={FileText}
          title="Laporan Peminjaman"
          desc="Data peminjaman barang termasuk status dan riwayat pengembalian"
          from={fromLoans}
          to={toLoans}
          setFrom={setFromLoans}
          setTo={setToLoans}
          onDownload={() => download("loans")}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </span>
        </button>
      </div>

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

