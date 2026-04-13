import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Items from "./pages/Items.jsx";
import Loans from "./pages/Loans.jsx";
import MasterData from "./pages/MasterData.jsx";
import { getToken } from "./lib/api.js";

function RequireAuth({ children }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
