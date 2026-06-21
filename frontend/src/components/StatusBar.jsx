import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { isDag } from '../lib/graph';

export default function StatusBar() {
  const { nodes, edges } = useStore(
    (s) => ({ nodes: s.nodes, edges: s.edges }),
    shallow,
  );

  const selectedNodes = nodes.filter((n) => n.selected).length;
  const selectedEdges = edges.filter((e) => e.selected).length;
  const selected = selectedNodes + selectedEdges;
  const dag = isDag(nodes, edges);

  return (
    <footer className="flex items-center justify-between px-4 h-7 bg-card border-t border-hairline shrink-0 text-[11px] text-ink-faint select-none">
      <div className="flex items-center gap-3">
        <span className="tabular-nums">{nodes.length} nodes</span>
        <span className="tabular-nums">{edges.length} edges</span>
        {selected > 0 && (
          <span className="tabular-nums text-accent">{selected} selected</span>
        )}
        <span
          className={`flex items-center gap-1 font-medium ${
            dag ? 'text-emerald-500' : 'text-amber-500'
          }`}
          title={dag ? 'Valid DAG' : 'Contains a cycle'}
        >
          <span className="text-[8px]">●</span>
          {dag ? 'DAG' : 'Cycle'}
        </span>
      </div>
      <span className="font-mono hidden md:inline">
        Ctrl+K Search · Ctrl+A Select all · Ctrl+Z Undo · Ctrl+D Duplicate · Del Delete
      </span>
    </footer>
  );
}
