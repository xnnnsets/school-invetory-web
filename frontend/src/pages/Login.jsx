import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consumeRedirectAfterLogin, fetchMe, login } from "../lib/auth";
import { useToast } from "../components/Toast.jsx";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, go to redirect target (avoid reload loop on 401)
    fetchMe()
      .then(() => nav(consumeRedirectAfterLogin(), { replace: true }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.push({ type: "success", title: "Login berhasil", message: "Selamat bekerja." });
      nav(consumeRedirectAfterLogin(), { replace: true });
    } catch (err) {
      setError(err?.message || "Gagal login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-stretch">
        <div className="hidden md:flex rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-700 text-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="my-auto">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Inventaris Sekolah</h1>
            <p className="mt-2 text-sm text-white/80">
              Kelola aset, stok, transaksi masuk/keluar, dan peminjaman dengan lebih rapi.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">Stok real-time</div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">Role-based</div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">Laporan cetak</div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10">Transparan</div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Masuk</h2>
            <p className="text-sm text-slate-600">Gunakan akun yang sudah disediakan.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Email</label>
            <input
              className="w-full border rounded-xl px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Password</label>
            <div className="relative">
              <input
                className="w-full border rounded-xl px-3 py-2 pr-10"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 inline-flex items-center justify-center text-slate-600 hover:text-slate-900"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-xl py-2 disabled:opacity-60"
            type="submit"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}

