import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store';

const fieldClasses =
  'w-full rounded-field border border-hairline bg-field px-2.5 py-1.5 text-[13px] text-ink outline-none ' +
  'transition-colors duration-140 placeholder:text-ink-faint ' +
  'focus:border-accent focus:ring-1 focus:ring-accent/30';

function useField(nodeId, name, initial) {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const storeValue = useStore(
    (s) => s.nodes.find((n) => n.id === nodeId)?.data?.[name],
  );
  const [value, setValue] = useState(initial);
  const localEdit = useRef(false);

  useEffect(() => {
    if (!localEdit.current && storeValue !== undefined && storeValue !== value) {
      setValue(storeValue);
    }
    localEdit.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeValue]);

  const flush = useCallback(
    (v) => updateNodeField(nodeId, name, v),
    [nodeId, name, updateNodeField],
  );
  const onChange = useCallback(
    (e) => {
      const v = e.target.value;
      localEdit.current = true;
      setValue(v);
      flush(v);
    },
    [flush],
  );
  return { value, onChange };
}

function TextField({ nodeId, field, data }) {
  const { value, onChange } = useField(nodeId, field.name, data[field.name] ?? field.default ?? '');
  return (
    <input
      type="text"
      className={fieldClasses}
      placeholder={field.placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

function TextAreaField({ nodeId, field, data }) {
  const { value, onChange } = useField(nodeId, field.name, data[field.name] ?? field.default ?? '');
  return (
    <textarea
      className={fieldClasses + ' resize-none min-h-[56px]'}
      placeholder={field.placeholder}
      rows={field.rows ?? 3}
      value={value}
      onChange={onChange}
    />
  );
}

function SelectField({ nodeId, field, data }) {
  const { value, onChange } = useField(nodeId, field.name, data[field.name] ?? field.default ?? '');
  return (
    <select className={fieldClasses + ' cursor-pointer'} value={value} onChange={onChange}>
      {(field.options ?? []).map((opt) => (
        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      ))}
    </select>
  );
}

function NumberField({ nodeId, field, data }) {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const storeValue = useStore(
    (s) => s.nodes.find((n) => n.id === nodeId)?.data?.[field.name],
  );
  const [value, setValue] = useState(data[field.name] ?? field.default ?? 0);
  const localEdit = useRef(false);

  useEffect(() => {
    if (!localEdit.current && storeValue !== undefined && storeValue !== value) {
      setValue(storeValue);
    }
    localEdit.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeValue]);

  const onChange = useCallback(
    (e) => {
      const v = e.target.value === '' ? '' : Number(e.target.value);
      localEdit.current = true;
      setValue(v);
      updateNodeField(nodeId, field.name, v);
    },
    [nodeId, field.name, updateNodeField],
  );
  return (
    <input
      type="number"
      className={fieldClasses}
      value={value}
      min={field.min}
      max={field.max}
      step={field.step}
      onChange={onChange}
    />
  );
}

function SliderField({ nodeId, field, data }) {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const storeValue = useStore(
    (s) => s.nodes.find((n) => n.id === nodeId)?.data?.[field.name],
  );
  const [value, setValue] = useState(data[field.name] ?? field.default ?? field.min ?? 0);
  const localEdit = useRef(false);

  useEffect(() => {
    if (!localEdit.current && storeValue !== undefined && storeValue !== value) {
      setValue(storeValue);
    }
    localEdit.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeValue]);

  const onChange = useCallback(
    (e) => {
      const v = Number(e.target.value);
      localEdit.current = true;
      setValue(v);
      updateNodeField(nodeId, field.name, v);
    },
    [nodeId, field.name, updateNodeField],
  );
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        className="flex-1 accent-accent h-1.5 cursor-pointer"
        min={field.min ?? 0}
        max={field.max ?? 100}
        step={field.step ?? 1}
        value={value}
        onChange={onChange}
      />
      <span className="text-xs text-ink-muted tabular-nums w-8 text-right">{value}</span>
    </div>
  );
}

function CheckboxField({ nodeId, field, data }) {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const storeValue = useStore(
    (s) => s.nodes.find((n) => n.id === nodeId)?.data?.[field.name],
  );
  const [checked, setChecked] = useState(data[field.name] ?? field.default ?? false);
  const localEdit = useRef(false);

  useEffect(() => {
    if (!localEdit.current && storeValue !== undefined && storeValue !== checked) {
      setChecked(storeValue);
    }
    localEdit.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeValue]);

  const onChange = useCallback(
    (e) => {
      localEdit.current = true;
      setChecked(e.target.checked);
      updateNodeField(nodeId, field.name, e.target.checked);
    },
    [nodeId, field.name, updateNodeField],
  );
  return (
    <label className="flex items-center gap-2 cursor-pointer text-[13px]">
      <input
        type="checkbox"
        className="accent-accent w-3.5 h-3.5 cursor-pointer"
        checked={checked}
        onChange={onChange}
      />
      <span className="text-ink-muted">{field.checkLabel ?? field.label}</span>
    </label>
  );
}

const FIELD_MAP = {
  text: TextField,
  textarea: TextAreaField,
  select: SelectField,
  number: NumberField,
  slider: SliderField,
  checkbox: CheckboxField,
};

export default function FieldRenderer({ fields, nodeId, data }) {
  if (!fields || fields.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5 px-3 pb-3">
      {fields.map((field) => {
        const Component = FIELD_MAP[field.type];
        if (!Component) return null;
        return (
          <div key={field.name}>
            {field.type !== 'checkbox' && field.label && (
              <label className="block text-[11px] font-medium text-ink-muted mb-1 uppercase tracking-wide">
                {field.label}
              </label>
            )}
            <Component nodeId={nodeId} field={field} data={data} />
          </div>
        );
      })}
    </div>
  );
}
