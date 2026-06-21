import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../store';
import { useUpdateNodeInternals } from 'reactflow';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const MIN_WIDTH = 260;
const MAX_WIDTH = 480;
const WIDTH_PAD = 48;
const MAX_TEXTAREA_HEIGHT = 240;

export default function TextNodeBody({ id, data }) {
  const setTextNodeContent = useStore((s) => s.setTextNodeContent);
  const updateNodeField = useStore((s) => s.updateNodeField);
  const storeText = useStore(
    (s) => s.nodes.find((n) => n.id === id)?.data?.text,
  );
  const updateNodeInternals = useUpdateNodeInternals();

  const [localText, setLocalText] = useState(data.text ?? '');
  const textareaRef = useRef(null);
  const prevVarsRef = useRef('');
  const localEdit = useRef(false);
  const canvasCtxRef = useRef(null);
  const prevWidthRef = useRef(MIN_WIDTH);

  useEffect(() => {
    if (!localEdit.current && storeText !== undefined && storeText !== localText) {
      setLocalText(storeText);
    }
    localEdit.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeText]);

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      localEdit.current = true;
      setLocalText(val);
      setTextNodeContent(id, val);
    },
    [id, setTextNodeContent],
  );

  // Auto-resize height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    const nextHeight = Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }, [localText]);

  // Auto-resize width based on longest line
  useEffect(() => {
    if (!canvasCtxRef.current) {
      const canvas = document.createElement('canvas');
      canvasCtxRef.current = canvas.getContext('2d');
    }
    const ctx = canvasCtxRef.current;
    ctx.font = `13px ${MONO_FONT}`;
    const lines = localText.split('\n');
    const maxLine = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
    const desired = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, maxLine + WIDTH_PAD));
    if (desired !== prevWidthRef.current) {
      prevWidthRef.current = desired;
      updateNodeField(id, '_nodeWidth', desired);
      // Width change moves the right-column output handle's x — re-measure.
      updateNodeInternals(id);
    }
  }, [localText, id, updateNodeField, updateNodeInternals]);

  // Notify React Flow when the set of variable handles changes
  useEffect(() => {
    const key = (data.variables ?? []).join(',');
    if (key !== prevVarsRef.current) {
      prevVarsRef.current = key;
      updateNodeInternals(id);
    }
  }, [data.variables, id, updateNodeInternals]);

  // Render variable badges
  const vars = data.variables ?? [];

  return (
    <div className="px-3 pb-3 pt-2.5">
      <label htmlFor={`${id}-text`} className="block text-[11px] font-medium text-ink-muted mb-1 uppercase tracking-wide">
        Text
      </label>
      <textarea
        id={`${id}-text`}
        ref={textareaRef}
        className={
          'w-full rounded-field border border-hairline bg-field px-2.5 py-1.5 font-mono text-[13px] text-ink ' +
          'outline-none transition-colors duration-140 placeholder:text-ink-faint resize-none min-h-[40px] ' +
          'focus:border-accent focus:ring-1 focus:ring-accent/30'
        }
        placeholder="Enter text or {{ variables }}"
        value={localText}
        onChange={handleChange}
      />
      {vars.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {vars.map((v) => (
            <span
              key={v}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent-tint text-accent text-[11px] font-semibold"
            >
              {`{{ ${v} }}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
