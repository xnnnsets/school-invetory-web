import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

const ToastCtx = createContext(null);

function iconFor(type) {
  if (type === "success") return CheckCircle2;
  if (type === "error") return TriangleAlert;
  return Info;
}

function styleFor(type) {
  if (type === "success") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (type === "error") return "bg-rose-50 text-rose-800 ring-rose-200";
  return "bg-slate-50 text-slate-800 ring-slate-200";
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = crypto?.randomUUID?.() || String(Date.now() + Math.random());
    const t = { id, type: "info", title: "", message: "", durationMs: 2800, ...toast };
    setToasts((arr) => [...arr, t]);
    window.setTimeout(() => {
      setToasts((arr) => arr.filter((x) => x.id !== id));
    }, t.durationMs);
  }, []);

  const api = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((t) => {
          const Icon = iconFor(t.type);
          return (
            <div
              key={t.id}
              className={`w-[340px] rounded-2xl ring-1 shadow-sm bg-white overflow-hidden`}
            >
              <div className={`p-3 flex gap-2 items-start ${styleFor(t.type)}`}>
                <Icon className="h-5 w-5 mt-0.5" />
                <div className="min-w-0 flex-1">
                  {t.title ? <div className="text-sm font-semibold">{t.title}</div> : null}
                  {t.message ? <div className="text-xs opacity-90">{t.message}</div> : null}
                </div>
                <button
                  className="rounded-lg p-1 hover:bg-black/5"
                  onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))}
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider is missing");
  return ctx;
}

