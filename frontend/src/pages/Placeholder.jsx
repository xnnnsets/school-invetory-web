export default function Placeholder({ title, subtitle }) {
  return (
    <div className="max-w-6xl">
      <div className="mb-4">
        <div className="text-xl font-semibold">{title}</div>
        {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Halaman ini sedang dalam pengerjaan sesuai redesign referensi.
      </div>
    </div>
  );
}

