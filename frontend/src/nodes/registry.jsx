// Node registry: every node in the pipeline builder is defined by a config
// object here. Adding a new node means adding one entry (~10 lines).
//
// Each config is { type, title, icon, category, accent, width?, fields[],
// handles[] | deriveHandles(data), init?, body?, description? }.
//
// The registry drives:
//   - React Flow's nodeTypes (via buildNodeTypes)
//   - the toolbar rail (via CATEGORIES + configs)
//   - getInitData(type) for seeding default field values into the store

import {
  FileInput,
  FileOutput,
  BrainCircuit,
  Type,
  Calculator,
  GitBranch,
  Globe,
  Merge,
  SlidersHorizontal,
} from 'lucide-react';
import BaseNode from './BaseNode';
import TextNodeBody from './text/TextNodeBody';
import MergeNodeBody from './merge/MergeNodeBody';

// ─── 4 original nodes ────────────────────────────────────────────────────────

const inputNode = {
  type: 'customInput',
  title: 'Input',
  icon: FileInput,
  category: 'io',
  accent: '#0ea5e9',
  fields: [
    { name: 'inputName', label: 'Name', type: 'text', placeholder: 'input_1' },
    {
      name: 'inputType',
      label: 'Type',
      type: 'select',
      default: 'Text',
      options: ['Text', 'File'],
    },
  ],
  handles: [{ type: 'source', side: 'right', id: 'value', label: 'value' }],
  init: (id) => ({
    inputName: id.replace('customInput-', 'input_'),
    inputType: 'Text',
  }),
};

const outputNode = {
  type: 'customOutput',
  title: 'Output',
  icon: FileOutput,
  category: 'io',
  accent: '#0ea5e9',
  fields: [
    { name: 'outputName', label: 'Name', type: 'text', placeholder: 'output_1' },
    {
      name: 'outputType',
      label: 'Type',
      type: 'select',
      default: 'Text',
      options: ['Text', 'Image'],
    },
  ],
  handles: [{ type: 'target', side: 'left', id: 'value', label: 'value' }],
  init: (id) => ({
    outputName: id.replace('customOutput-', 'output_'),
    outputType: 'Text',
  }),
};

const llmNode = {
  type: 'llm',
  title: 'LLM',
  icon: BrainCircuit,
  category: 'llm',
  accent: '#8b5cf6',
  description: 'Processes prompts using a Large Language Model.',
  fields: [],
  handles: [
    { type: 'target', side: 'left', id: 'system', label: 'system' },
    { type: 'target', side: 'left', id: 'prompt', label: 'prompt' },
    { type: 'source', side: 'right', id: 'response', label: 'response' },
  ],
};

const textNode = {
  type: 'text',
  title: 'Text',
  icon: Type,
  category: 'io',
  accent: '#0ea5e9',
  body: TextNodeBody,
  handles: (data) => {
    const vars = data.variables ?? [];
    const dynamic = vars.map((v) => ({
      type: 'target',
      side: 'left',
      id: `var-${v}`,
      label: v,
    }));
    return [...dynamic, { type: 'source', side: 'right', id: 'output', label: 'output' }];
  },
  init: () => ({
    text: '{{input}}',
    variables: ['input'],
  }),
};

// ─── 5 new demo nodes ────────────────────────────────────────────────────────

const mathNode = {
  type: 'math',
  title: 'Math',
  icon: Calculator,
  category: 'logic',
  accent: '#f59e0b',
  fields: [
    { name: 'a', label: 'A', type: 'number', default: 0 },
    { name: 'b', label: 'B', type: 'number', default: 0 },
    {
      name: 'operation',
      label: 'Operation',
      type: 'select',
      default: 'add',
      options: [
        { value: 'add', label: 'Add (+)' },
        { value: 'subtract', label: 'Subtract (−)' },
        { value: 'multiply', label: 'Multiply (×)' },
        { value: 'divide', label: 'Divide (÷)' },
      ],
    },
  ],
  handles: [
    { type: 'target', side: 'left', id: 'input', label: 'input' },
    { type: 'source', side: 'right', id: 'result', label: 'result' },
  ],
};

const filterNode = {
  type: 'filter',
  title: 'Filter',
  icon: GitBranch,
  category: 'logic',
  accent: '#f59e0b',
  fields: [
    { name: 'condition', label: 'Condition', type: 'text', placeholder: 'e.g. value > 10' },
  ],
  handles: [
    { type: 'target', side: 'left', id: 'input', label: 'input' },
    { type: 'source', side: 'right', id: 'true', label: 'true' },
    { type: 'source', side: 'right', id: 'false', label: 'false' },
  ],
};

const httpNode = {
  type: 'http',
  title: 'API Request',
  icon: Globe,
  category: 'net',
  accent: '#ef4444',
  fields: [
    { name: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com' },
    {
      name: 'method',
      label: 'Method',
      type: 'select',
      default: 'GET',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    { name: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{}', rows: 2 },
  ],
  handles: [
    { type: 'target', side: 'left', id: 'body', label: 'body' },
    { type: 'target', side: 'left', id: 'trigger', label: 'trigger' },
    { type: 'source', side: 'right', id: 'response', label: 'response' },
    { type: 'source', side: 'right', id: 'error', label: 'error' },
  ],
};

const mergeNode = {
  type: 'merge',
  title: 'Merge',
  icon: Merge,
  category: 'data',
  accent: '#10b981',
  body: MergeNodeBody,
  handles: (data) => {
    const count = data.inputCount ?? 2;
    const inputs = Array.from({ length: count }, (_, i) => ({
      type: 'target',
      side: 'left',
      id: `in-${i}`,
      label: `in ${i + 1}`,
    }));
    return [...inputs, { type: 'source', side: 'right', id: 'merged', label: 'merged' }];
  },
  init: () => ({ inputCount: 2 }),
};

const thresholdNode = {
  type: 'threshold',
  title: 'Threshold',
  icon: SlidersHorizontal,
  category: 'logic',
  accent: '#f59e0b',
  fields: [
    { name: 'value', label: 'Threshold', type: 'slider', default: 50, min: 0, max: 100 },
    { name: 'invert', label: '', type: 'checkbox', checkLabel: 'Invert condition', default: false },
  ],
  handles: [
    { type: 'target', side: 'left', id: 'input', label: 'input' },
    { type: 'source', side: 'right', id: 'above', label: 'above' },
    { type: 'source', side: 'right', id: 'below', label: 'below' },
  ],
};

// ─── Registry ────────────────────────────────────────────────────────────────

export const NODE_CONFIGS = [
  inputNode,
  outputNode,
  llmNode,
  textNode,
  mathNode,
  filterNode,
  httpNode,
  mergeNode,
  thresholdNode,
];

export const CATEGORIES = [
  { key: 'io', label: 'I/O' },
  { key: 'llm', label: 'AI' },
  { key: 'logic', label: 'Logic' },
  { key: 'data', label: 'Data' },
  { key: 'net', label: 'Network' },
];

const configByType = Object.fromEntries(NODE_CONFIGS.map((c) => [c.type, c]));

export function getConfig(type) {
  return configByType[type];
}

export function getInitData(type, id) {
  const cfg = configByType[type];
  if (!cfg) return { id, nodeType: type };
  const fieldDefaults = {};
  (cfg.fields ?? []).forEach((f) => {
    if (f.default !== undefined) fieldDefaults[f.name] = f.default;
  });
  const initData = cfg.init ? cfg.init(id) : {};
  return { id, nodeType: type, ...fieldDefaults, ...initData };
}

// Build React Flow's nodeTypes map. One wrapper component per config.
export function buildNodeTypes() {
  const types = {};
  for (const cfg of NODE_CONFIGS) {
    const NodeComponent = (props) => <BaseNode {...props} config={cfg} />;
    NodeComponent.displayName = `Node_${cfg.type}`;
    types[cfg.type] = NodeComponent;
  }
  return types;
}
