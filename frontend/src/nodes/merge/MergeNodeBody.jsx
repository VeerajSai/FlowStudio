import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { useUpdateNodeInternals } from 'reactflow';

export default function MergeNodeBody({ id, data }) {
  const setMergeInputCount = useStore((s) => s.setMergeInputCount);
  const storeCount = useStore(
    (s) => s.nodes.find((n) => n.id === id)?.data?.inputCount,
  );
  const updateNodeInternals = useUpdateNodeInternals();

  const [count, setCount] = useState(data.inputCount ?? 2);
  const prevCount = useRef(count);
  const localEdit = useRef(false);

  useEffect(() => {
    if (!localEdit.current && storeCount !== undefined && storeCount !== count) {
      setCount(storeCount);
    }
    localEdit.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeCount]);

  useEffect(() => {
    if (data.inputCount !== prevCount.current) {
      prevCount.current = data.inputCount;
      updateNodeInternals(id);
    }
  }, [data.inputCount, id, updateNodeInternals]);

  const handleChange = useCallback(
    (e) => {
      const v = Number(e.target.value);
      localEdit.current = true;
      setCount(v);
      setMergeInputCount(id, v);
    },
    [id, setMergeInputCount],
  );

  return (
    <div className="flex flex-col gap-2.5 px-3 pb-3 pt-2.5">
      <label className="block text-[11px] font-medium text-ink-muted uppercase tracking-wide">
        Inputs
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          className="flex-1 accent-accent h-1.5 cursor-pointer"
          min={2}
          max={8}
          step={1}
          value={count}
          onChange={handleChange}
        />
        <span className="text-xs text-ink-muted tabular-nums w-8 text-right">{count}</span>
      </div>
    </div>
  );
}
