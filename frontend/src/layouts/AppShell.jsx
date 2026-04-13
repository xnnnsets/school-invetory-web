import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookText,
  Boxes,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  Handshake,
  Home,
  LogOut,
  Package,
  PackageOpen,
  Settings,
  Users,
} from "lucide-react";
import { getUser, logout } from "../lib/auth.js";
import { RoleBadge } from "../components/Badge.jsx";

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
          isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
        }`
      }
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
        <Icon className="h-4 w-4" />
      </span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function getMenu(role) {
  if (role === "ADMIN") {
    return [
      { to: "/dashboard", icon: Home, label: "Dashboard" },
      { to: "/users", icon: Users, label: "Kelola Pengguna" },
      { to: "/items", icon: Boxes, label: "Data Barang" },
      { to: "/categories", icon: ClipboardList, label: "Kategori Barang" },
      { to: "/suppliers", icon: Package, label: "Data Supplier" },
      { to: "/school", icon: GraduationCap, label: "Data Sekolah" },
      { to: "/inbound", icon: PackageOpen, label: "Barang Masuk" },
      { to: "/outbound", icon: Download, label: "Barang Keluar" },
      { to: "/loans", icon: Handshake, label: "Peminjaman" },
      { to: "/reports", icon: FileText, label: "Laporan" },
    ];
  }
  if (role === "KEPALA_SEKOLAH") {
    return [
      { to: "/dashboard", icon: Home, label: "Dashboard" },
      { to: "/stock-monitoring", icon: Boxes, label: "Monitoring Stok" },
      { to: "/inbound", icon: PackageOpen, label: "Barang Masuk" },
      { to: "/outbound", icon: Download, label: "Barang Keluar" },
      { to: "/reports", icon: FileText, label: "Laporan" },
      { to: "/notifications", icon: Bell, label: "Notifikasi" },
    ];
  }
  if (role === "PETUGAS_TU") {
    return [
      { to: "/dashboard", icon: Home, label: "Dashboard" },
      { to: "/inbound", icon: PackageOpen, label: "Barang Masuk" },
      { to: "/outbound", icon: Download, label: "Barang Keluar" },
      { to: "/loans", icon: Handshake, label: "Peminjaman Barang" },
      { to: "/update-stock", icon: Settings, label: "Update Stok" },
    ];
  }
  // GURU
  return [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/requests", icon: BookText, label: "Ajukan Permintaan" },
    { to: "/loans", icon: Handshake, label: "Pinjam Barang" },
    { to: "/history", icon: ClipboardList, label: "Riwayat" },
  ];
}

export default function AppShell() {
  const user = getUser();
  const menu = getMenu(user?.role);
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <div className="min-h-full bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="w-[280px] border-r border-slate-200 bg-white">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500" />
              <div className="leading-tight">
                <div className="text-sm font-semibold">Inventaris</div>
                <div className="text-xs text-slate-500">Sekolah</div>
              </div>
            </div>
          </div>

          <div className="px-3 pb-3 space-y-1">
            {menu.map((m) => (
              <Item key={m.to} to={m.to} icon={m.icon} label={m.label} />
            ))}
          </div>

          <div className="mt-auto border-t border-slate-200 p-3">
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
              <div className="h-10 w-10 rounded-2xl bg-white ring-1 ring-slate-200" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{user?.name || "-"}</div>
                <div className="truncate text-xs text-slate-500">Profil Akun</div>
                <div className="mt-1">
                  <RoleBadge role={user?.role} />
                </div>
              </div>
            </div>
            <button
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </aside>

        <main className="flex-1">
          {/* Route content */}
          <div key={loc.pathname} className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

