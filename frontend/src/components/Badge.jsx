const roleLabel = {
  ADMIN: "Administrator",
  KEPALA_SEKOLAH: "Kepala Sekolah",
  PETUGAS_TU: "Petugas TU",
  GURU: "Guru",
};

const roleStyle = {
  ADMIN: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  KEPALA_SEKOLAH: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  PETUGAS_TU: "bg-amber-50 text-amber-800 ring-amber-200",
  GURU: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function RoleBadge({ role }) {
  const label = roleLabel[role] || role;
  const style = roleStyle[role] || "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${style}`}>
      {label}
    </span>
  );
}

