import { useRef, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import ResultDialog from './ResultDialog';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SubmitButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const submitRef = useRef(null);

  const handleSubmit = async () => {
    const { nodes, edges } = useStore.getState();
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!resp.ok) throw new Error(`Server error (${resp.status})`);
      const data = await resp.json();

      const friendly =
        `Pipeline analysis:\n` +
        `  Nodes: ${data.num_nodes}\n` +
        `  Edges: ${data.num_edges}\n` +
        `  Valid DAG: ${data.is_dag ? 'Yes' : 'No'}`;
      window.alert(friendly);

      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        ref={submitRef}
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-semibold shadow-sm hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-60 transition-colors duration-140"
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
        {loading ? 'Submitting…' : 'Submit'}
      </button>
      <ResultDialog
        result={result}
        onClose={() => setResult(null)}
        restoreFocusRef={submitRef}
      />
    </>
  );
}
