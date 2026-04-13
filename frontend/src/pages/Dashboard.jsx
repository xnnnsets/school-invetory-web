import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StatCard from "../components/StatCard.jsx";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth";
import { useEffect, useMemo, useState } from "react";

export default function Dashboard() {
  const user = getUser();
  const [items, setItems] = useState([]);
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [i, l] = await Promise.all([apiFetch("/api/items"), apiFetch("/api/loans")]);
      setItems(i.data);
      setLoans(l.data);
    } catch (e) {
      setError(e?.message || "Gagal memuat ringkasan");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const lowStock = useMemo(
    () => items.filter((x) => (x.minStock || 0) > 0 && x.stock <= x.minStock).length,
    [items],
  );

  const pendingLoans = useMemo(() => loans.filter((x) => x.status === "PENDING").length, [loans]);

  return (
    <Layout
      title={`Halo, ${user?.name || "Pengguna"}`}
      subtitle="Ringkasan inventaris hari ini."
      actions={
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
          Refresh
        </button>
      }
    >
      {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}

      <div className="grid md:grid-cols-3 gap-3">
        <StatCard label="Total Barang" value={items.length} hint="Jumlah item terdaftar" />
        <StatCard
          label="Stok Menipis"
          value={lowStock}
          hint="Perlu pengadaan/monitor"
          accent="from-rose-600 to-orange-500"
        />
        <StatCard
          label="Peminjaman Pending"
          value={pendingLoans}
          hint={user?.role === "GURU" ? "Menunggu diproses TU" : "Perlu ditindaklanjuti"}
          accent="from-amber-500 to-yellow-300"
        />
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <Link className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50" to="/master/items">
          <div className="font-semibold">Stok & Master Barang</div>
          <div className="text-sm text-slate-600">Cari barang, cek stok, dan cetak laporan sederhana.</div>
        </Link>
        <Link className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50" to="/loans">
          <div className="font-semibold">Peminjaman</div>
          <div className="text-sm text-slate-600">Ajukan, approve, dan catat pengembalian secara transparan.</div>
        </Link>
      </div>
    </Layout>
  );
}

