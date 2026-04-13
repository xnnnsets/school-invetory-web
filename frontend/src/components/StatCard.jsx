export default function StatCard({ label, value, hint, accent = "from-indigo-600 to-cyan-500" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-slate-600">{label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
          {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>
        <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${accent}`} />
      </div>
    </div>
  );
}

