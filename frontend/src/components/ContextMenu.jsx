import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Copy, Trash2, ClipboardPaste, Layers, CopyPlus } from 'lucide-react';

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x, y });

  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const margin = 8;
    const rect = menu.getBoundingClientRect();
    setPosition({
      x: Math.max(margin, Math.min(x, window.innerWidth - rect.width - margin)),
      y: Math.max(margin, Math.min(y, window.innerHeight - rect.height - margin)),
    });
  }, [x, y, items]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  if (!items || items.length === 0) return null;

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-[100] bg-card rounded-lg shadow-pop border border-hairline py-1 min-w-[180px] animate-in fade-in"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="my-1 border-t border-hairline" />
        ) : (
          <button
            role="menuitem"
            key={i}
            onClick={() => {
              item.action();
              onClose();
            }}
            disabled={item.disabled}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-ink hover:bg-accent-tint hover:text-accent transition-colors disabled:opacity-40 disabled:pointer-events-none text-left"
          >
            {item.icon && <item.icon size={14} className="shrink-0 text-ink-muted" />}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-[11px] text-ink-faint font-mono">{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

export const ICON = { Copy, Trash2, ClipboardPaste, Layers, CopyPlus };
