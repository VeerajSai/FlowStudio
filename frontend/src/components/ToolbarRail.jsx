import { CATEGORIES, NODE_CONFIGS } from '../nodes/registry';
import DraggableNode from './DraggableNode';

export default function ToolbarRail({ onAdd }) {
  return (
    <aside className="w-[180px] shrink-0 bg-card border-r border-hairline overflow-y-auto py-4 px-3 flex flex-col gap-5">
      {CATEGORIES.map((cat) => {
        const nodes = NODE_CONFIGS.filter((n) => n.category === cat.key);
        if (nodes.length === 0) return null;
        return (
          <div key={cat.key}>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint mb-2 px-1">
              {cat.label}
            </h3>
            <div className="flex flex-col gap-1.5">
              {nodes.map((n) => (
                <DraggableNode key={n.type} type={n.type} onAdd={onAdd} />
              ))}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
