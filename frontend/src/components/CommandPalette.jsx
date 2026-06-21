import { useState, useEffect, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { NODE_CONFIGS } from '../nodes/registry';

export default function CommandPalette({ open, onClose, onSelectNode }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const prevFocusRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return NODE_CONFIGS;
    const q = query.toLowerCase();
    return NODE_CONFIGS.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [query]);

  // Capture the trigger's focus on open and restore it on close.
  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement;
    setQuery('');
    setSelectedIdx(0);
    const t = setTimeout(() => inputRef.current?.focus(), 50);

    const onDocumentKeyDown = (e) => {
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
      const focusInside = panelRef.current?.contains(document.activeElement);
      if (!focusInside) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onDocumentKeyDown);

    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onDocumentKeyDown);
      if (prevFocusRef.current && prevFocusRef.current.focus) {
        prevFocusRef.current.focus();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [results.length]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      onSelectNode(results[selectedIdx].type);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  const activeId = results[selectedIdx] ? `cmd-opt-${results[selectedIdx].type}` : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add node"
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-card rounded-xl shadow-pop border border-hairline w-[420px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-hairline">
          <Search size={16} className="text-ink-faint shrink-0" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-palette-list"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
            aria-label="Search nodes"
            className="flex-1 text-[14px] text-ink placeholder:text-ink-faint outline-none bg-transparent"
            placeholder="Search nodes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="text-[10px] text-ink-faint border border-hairline rounded px-1.5 py-0.5 font-mono">
            Esc
          </kbd>
        </div>
        <div id="cmd-palette-list" role="listbox" aria-label="Nodes" className="max-h-[280px] overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-6 text-sm text-ink-faint text-center">No nodes found.</p>
          )}
          {results.map((cfg, i) => {
            const Icon = cfg.icon;
            return (
              <button
                role="option"
                id={`cmd-opt-${cfg.type}`}
                aria-selected={i === selectedIdx}
                key={cfg.type}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  i === selectedIdx ? 'bg-accent-tint text-accent' : 'text-ink hover:bg-canvas'
                }`}
                onClick={() => {
                  onSelectNode(cfg.type);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                {Icon && (
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-md shrink-0"
                    style={{ background: (cfg.accent ?? '#6b7280') + '18' }}
                  >
                    <Icon size={14} style={{ color: cfg.accent }} />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{cfg.title}</div>
                  <div className="text-[11px] text-ink-faint capitalize">{cfg.category}</div>
                </div>
                {i === selectedIdx && (
                  <kbd className="text-[10px] text-ink-faint border border-hairline rounded px-1.5 py-0.5 font-mono">
                    Enter
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
