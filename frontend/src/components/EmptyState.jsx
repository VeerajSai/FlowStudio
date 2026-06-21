import { MousePointerClick } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-[1]">
      <MousePointerClick size={40} className="text-ink-faint/40 mb-3" />
      <p className="text-sm text-ink-faint font-medium">
        Drag a node from the left to start building your pipeline.
      </p>
    </div>
  );
}
