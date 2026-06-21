import { useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from './Toaster';

export default function PipelineActions() {
  const fileRef = useRef(null);
  const toast = useToast();

  const handleExport = () => {
    const json = useStore.getState().exportPipeline();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Pipeline exported successfully.', 'success');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = useStore.getState().importPipeline(ev.target.result);
      if (ok) {
        toast('Pipeline imported successfully.', 'success');
      } else {
        toast('Invalid pipeline file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    if (!window.confirm('Clear all nodes and edges?')) return;
    useStore.getState().clearPipeline();
    toast('Pipeline cleared.', 'info');
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleExport}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-hairline hover:bg-canvas dark:hover:bg-white/10 transition-colors duration-140 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        title="Export pipeline (JSON)"
        aria-label="Export pipeline"
      >
        <Download size={15} className="text-ink-muted" />
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-hairline hover:bg-canvas dark:hover:bg-white/10 transition-colors duration-140 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        title="Import pipeline (JSON)"
        aria-label="Import pipeline"
      >
        <Upload size={15} className="text-ink-muted" />
      </button>
      <button
        onClick={handleClear}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-hairline hover:bg-canvas hover:border-red-400/60 hover:text-red-500 dark:hover:bg-white/10 transition-colors duration-140 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        title="Clear pipeline"
        aria-label="Clear pipeline"
      >
        <Trash2 size={15} className="text-ink-muted" />
      </button>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
    </div>
  );
}
