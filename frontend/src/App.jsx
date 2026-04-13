import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AppShell from "./layouts/AppShell.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Items from "./pages/Items.jsx";
import Loans from "./pages/Loans.jsx";
import MasterData from "./pages/MasterData.jsx";
import Transactions from "./pages/Transactions.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import Categories from "./pages/Categories.jsx";
import Suppliers from "./pages/Suppliers.jsx";
import Requests from "./pages/Requests.jsx";
import History from "./pages/History.jsx";
import { getToken, setOnUnauthorized } from "./lib/api.js";
import { logout, setRedirectAfterLogin } from "./lib/auth.js";
import { useEffect } from "react";

function RequireAuth({ children }) {
  const token = getToken();
  const loc = useLocation();
  if (!token) {
    setRedirectAfterLogin(loc.pathname);
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    });
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Placeholder title="Kelola Pengguna" subtitle="Manajemen akun & role." />} />

        {/* Master */}
        <Route path="items" element={<Items />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="school" element={<Placeholder title="Data Sekolah" subtitle="Profil sekolah." />} />

        {/* Transactions */}
        <Route path="inbound" element={<Transactions mode="inbound" />} />
        <Route path="outbound" element={<Transactions mode="outbound" />} />

        {/* Loans/Requests */}
        <Route path="loans" element={<Loans />} />
        <Route path="requests" element={<Requests />} />
        <Route path="history" element={<History />} />

        {/* Kepsek */}
        <Route path="stock-monitoring" element={<Items />} />
        <Route path="notifications" element={<Placeholder title="Notifikasi" subtitle="Info stok, transaksi, dan permintaan." />} />

        {/* TU */}
        <Route path="update-stock" element={<MasterData />} />

        {/* Reports */}
        <Route path="reports" element={<Placeholder title="Laporan" subtitle="Cetak laporan stok, masuk, keluar, peminjaman." />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
