import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import { apiFetch } from "../lib/api.js";
import { getUser } from "../lib/auth.js";

const TABS = [
  { key: "categories", label: "Kategori", endpoint: "/api/categories", canCreate: true },
  { key: "rooms", label: "Ruangan", endpoint: "/api/rooms", canCreate: true },
  { key: "suppliers", label: "Supplier", endpoint: "/api/suppliers", canCreate: true },
];

function canManage(role) {
  return role === "ADMIN" || role === "PETUGAS_TU";
}

export default function MasterData() {
  const user = getUser();
  const manage = canManage(user?.role);

  const [tab, setTab] = useState("categories");
  const active = useMemo(() => TABS.find((t) => t.key === tab) || TABS[0], [tab]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(active.endpoint);
      setRows(res.data);
    } catch (e) {
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.endpoint]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  async function create() {
    setSaving(true);
    setError("");
    try {
      const body =
        active.key === "suppliers"
          ? { name: form.name, phone: form.phone || undefined, address: form.address || undefined }
          : { name: form.name };
      await apiFetch(active.endpoint, { method: "POST", body });
      setOpen(false);
      setForm({ name: "", phone: "", address: "" });
      await load();
    } catch (e) {
      setError(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout
      title="Master Data"
      subtitle="Kategori, ruangan, dan supplier untuk mendukung pencatatan inventaris."
      actions={
        <>
          <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50" onClick={load}>
            Refresh
          </button>
          {manage ? (
            <button
              className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800"
              onClick={() => setOpen(true)}
            >
              + Tambah {active.label}
            </button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-3 py-2 text-sm transition ${
                tab === t.key ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder={`Cari ${active.label.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left font-medium px-3 py-2">Nama</th>
              {active.key === "suppliers" ? (
                <>
                  <th className="text-left font-medium px-3 py-2">Telepon</th>
                  <th className="text-left font-medium px-3 py-2">Alamat</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={active.key === "suppliers" ? 3 : 1} className="px-3 py-6 text-center text-slate-500">
                  Memuat...
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  {active.key === "suppliers" ? (
                    <>
                      <td className="px-3 py-2 text-slate-600">{r.phone || "-"}</td>
                      <td className="px-3 py-2 text-slate-600">{r.address || "-"}</td>
                    </>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={active.key === "suppliers" ? 3 : 1} className="px-3 py-6 text-center text-slate-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg ring-1 ring-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Tambah {active.label}</div>
                <div className="text-sm text-slate-600">Pastikan data sesuai agar laporan rapi.</div>
              </div>
              <button className="rounded-lg px-2 py-1 hover:bg-slate-100" onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Nama</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={`Nama ${active.label}`}
                />
              </div>
              {active.key === "suppliers" ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Telepon</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Alamat</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Alamat supplier"
                    />
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm" onClick={() => setOpen(false)}>
                Batal
              </button>
              <button
                disabled={saving}
                className="rounded-xl bg-slate-900 text-white px-3 py-2 text-sm disabled:opacity-60"
                onClick={create}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}

