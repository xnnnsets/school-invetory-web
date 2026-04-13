import { Link } from "react-router-dom";
import { getUser, logout } from "../lib/auth";

export default function Dashboard() {
  const user = getUser();
  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600">Login sebagai</div>
            <div className="font-semibold">{user?.name} ({user?.role})</div>
            <div className="text-sm text-slate-600">{user?.email}</div>
          </div>
          <button
            className="px-3 py-2 rounded-lg border"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Keluar
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Link className="bg-white rounded-xl shadow p-4 hover:bg-slate-50" to="/master/items">
            <div className="font-semibold">Master Barang</div>
            <div className="text-sm text-slate-600">Lihat stok & data barang</div>
          </Link>
          <Link className="bg-white rounded-xl shadow p-4 hover:bg-slate-50" to="/loans">
            <div className="font-semibold">Peminjaman</div>
            <div className="text-sm text-slate-600">Ajukan & pantau peminjaman</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

