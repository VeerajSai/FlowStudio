import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
const COLORS = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  warning: 'border-l-amber-500',
  info: 'border-l-accent',
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div role="region" aria-live="polite" aria-label="Notifications" className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 w-[340px] pointer-events-none">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function Toast({ toast, onClose }) {
  const [visible, setVisible] = useState(false);
  const Icon = ICONS[toast.type] || Info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 bg-card rounded-lg shadow-pop border border-hairline border-l-4 ${COLORS[toast.type] || COLORS.info} transition-all duration-200 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      <Icon size={16} className="shrink-0 mt-0.5 text-ink-muted" />
      <p className="flex-1 text-[13px] text-ink leading-snug">{toast.message}</p>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="shrink-0 text-ink-faint hover:text-ink transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <X size={14} />
      </button>
    </div>
  );
}
