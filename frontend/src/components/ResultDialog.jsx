import { useEffect, useRef } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export default function ResultDialog({ result, onClose, restoreFocusRef }) {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const prevFocusRef = useRef(null);

  // Focus management: trap Tab within the dialog, close on Escape, focus the
  // Close button on open, and restore focus to the trigger on close.
  useEffect(() => {
    if (!result) return;
    prevFocusRef.current = restoreFocusRef?.current ?? document.activeElement;
    closeBtnRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (prevFocusRef.current && prevFocusRef.current.focus) {
        prevFocusRef.current.focus();
      }
    };
  }, [result, onClose, restoreFocusRef]);

  if (!result) return null;

  const isError = !!result.error;
  const isDag = result.is_dag;

  return (
    <div role="dialog" aria-modal="true" aria-label="Pipeline result" className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div ref={panelRef} className="relative bg-card rounded-node shadow-pop w-[360px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Accent bar */}
        <div
          className="h-1"
          style={{
            background: isError ? '#ef4444' : isDag ? '#513dd9' : '#f59e0b',
          }}
        />
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-ink-faint hover:text-ink transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded"
        >
          <X size={16} />
        </button>
        <div className="px-6 py-5">
          {isError ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <XCircle size={20} className="text-red-500" />
                <h2 className="text-sm font-semibold text-ink">Analysis Error</h2>
              </div>
              <p className="text-sm text-ink-muted">{result.error}</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                {isDag ? (
                  <CheckCircle2 size={20} className="text-accent" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-500" />
                )}
                <h2 className="text-sm font-semibold text-ink">
                  {isDag ? 'Valid Pipeline' : 'Cycle Detected'}
                </h2>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Nodes" value={result.num_nodes} />
                <Stat label="Edges" value={result.num_edges} />
                <Stat label="DAG" value={isDag ? 'Yes' : 'No'} accent={isDag} />
              </div>
            </>
          )}
        </div>
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-accent text-white text-[13px] font-semibold hover:bg-accent-hover transition-colors duration-140"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg bg-canvas p-3">
      <div className={`text-xl font-bold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</div>
      <div className="text-[11px] text-ink-muted font-medium mt-0.5">{label}</div>
    </div>
  );
}
