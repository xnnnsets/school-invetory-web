export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-sm" />
      <div className="leading-tight">
        <div className="text-sm font-semibold">Inventaris Sekolah</div>
        <div className="text-[11px] text-slate-500">Aset • Stok • Peminjaman</div>
      </div>
    </div>
  );
}

