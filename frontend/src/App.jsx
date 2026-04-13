import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Items from "./pages/Items.jsx";
import Loans from "./pages/Loans.jsx";
import MasterData from "./pages/MasterData.jsx";
import Transactions from "./pages/Transactions.jsx";
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
      window.location.href = "/login";
    });
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/master/items"
        element={
          <RequireAuth>
            <Items />
          </RequireAuth>
        }
      />
      <Route
        path="/loans"
        element={
          <RequireAuth>
            <Loans />
          </RequireAuth>
        }
      />
      <Route
        path="/master"
        element={
          <RequireAuth>
            <MasterData />
          </RequireAuth>
        }
      />
      <Route
        path="/transactions"
        element={
          <RequireAuth>
            <Transactions />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
