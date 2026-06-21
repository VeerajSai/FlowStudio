import { getConfig } from '../nodes/registry';

export default function DraggableNode({ type, onAdd }) {
  const cfg = getConfig(type);
  if (!cfg) return null;

  const Icon = cfg.icon;
  const catColor = cfg.accent ?? '#6b7280';

  const onDragStart = (e) => {
    e.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType: type }),
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  // Keyboard / click parity for drag: Enter or Space (or a click) adds the node
  // to the canvas centre, so the rail is usable without a pointer.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAdd?.(type);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Add ${cfg.title} node`}
      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab bg-card border border-hairline hover:border-accent/40 hover:shadow-sm active:cursor-grabbing transition-all duration-140 select-none outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      draggable
      onDragStart={onDragStart}
      onClick={() => onAdd?.(type)}
      onKeyDown={onKeyDown}
    >
      {Icon && (
        <span
          className="flex items-center justify-center w-6 h-6 rounded-md shrink-0"
          style={{ background: catColor + '18' }}
        >
          <Icon size={13} style={{ color: catColor }} />
        </span>
      )}
      <span className="text-[12px] font-medium text-ink leading-none whitespace-nowrap">
        {cfg.title}
      </span>
    </div>
  );
}
