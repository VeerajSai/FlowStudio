import { Workflow } from 'lucide-react';

export default function TopBar({ children }) {
  return (
    <header className="flex items-center justify-between px-5 h-[52px] bg-card border-b border-hairline shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-white">
          <Workflow size={18} />
        </span>
        <span className="text-[15px] font-bold text-ink tracking-tight">FlowStudio</span>
        <span className="text-[13px] text-ink-muted font-medium hidden sm:inline">AI Workflow Builder</span>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </header>
  );
}
