// Canonical list of supported node types, kept in a plain (React-free) module
// so the store can validate imports without importing the registry (which pulls
// in BaseNode → FieldRenderer → store, a cycle). Must stay in sync with
// NODE_CONFIGS in registry.js.
export const VALID_NODE_TYPES = [
  'customInput',
  'customOutput',
  'llm',
  'text',
  'math',
  'filter',
  'http',
  'merge',
  'threshold',
];

export const VALID_NODE_TYPE_SET = new Set(VALID_NODE_TYPES);
