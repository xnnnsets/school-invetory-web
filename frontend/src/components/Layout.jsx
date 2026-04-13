import { NavLink, useNavigate } from "react-router-dom";
import { Boxes, ClipboardList, Handshake, Home, PackageSearch, Repeat2 } from "lucide-react";
import Logo from "./Logo.jsx";
import { RoleBadge } from "./Badge.jsx";
import { getUser, logout } from "../lib/auth.js";

function NavItem({ to, label, description, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2 transition ${
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
        }`
      }
    >
      <div className="flex items-center gap-2">
        {Icon ? (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-black/5">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {description ? <div className="text-xs opacity-80">{description}</div> : null}
        </div>
      </div>
    </NavLink>
  );
}

function getNav(role) {
  const common = [{ to: "/", label: "Dashboard", description: "Ringkasan & akses cepat", icon: Home }];
  if (role === "GURU") {
    return [
      ...common,
      { to: "/master/items", label: "Stok Barang", description: "Lihat stok tersedia", icon: PackageSearch },
      { to: "/loans", label: "Peminjaman", description: "Ajukan & riwayat pinjam", icon: Handshake },
    ];
  }
  if (role === "KEPALA_SEKOLAH") {
    return [
      ...common,
      { to: "/master/items", label: "Stok Barang", description: "Monitoring stok", icon: PackageSearch },
      { to: "/loans", label: "Peminjaman", description: "Monitoring peminjaman", icon: Handshake },
    ];
  }
  return [
    ...common,
    { to: "/master/items", label: "Master Barang", description: "Barang & stok", icon: Boxes },
    { to: "/master", label: "Master Data", description: "Kategori, ruangan, supplier", icon: ClipboardList },
    { to: "/transactions", label: "Transaksi", description: "Barang masuk & keluar", icon: Repeat2 },
    { to: "/loans", label: "Peminjaman", description: "Approve & pengembalian", icon: Handshake },
  ];
}

export default function Layout({ title, subtitle, actions, children }) {
  const user = getUser();
  const nav = getNav(user?.role);
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-12 gap-4">
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4">
              <Logo />
              <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 text-white p-4">
                <div className="text-sm opacity-90">Akun</div>
                <div className="mt-1 font-semibold">{user?.name || "-"}</div>
                <div className="text-xs opacity-80">{user?.email || "-"}</div>
                <div className="mt-2">
                  <RoleBadge role={user?.role} />
                </div>
              </div>

              <div className="mt-4 space-y-1">
                {nav.map((it) => (
                  <NavItem key={it.to} to={it.to} label={it.label} description={it.description} icon={it.icon} />
                ))}
              </div>

              <button
                className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Keluar
              </button>
            </div>
          </aside>

          <main className="col-span-12 md:col-span-8 lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
                  {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
                </div>
                <div className="flex gap-2 flex-wrap">{actions}</div>
              </div>
              <div className="mt-5">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

