import { createWithEqualityFn } from 'zustand/traditional';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { parseVariables } from './nodes/text/variables';
import { VALID_NODE_TYPE_SET } from './nodes/types';

const MAX_HISTORY = 50;
const AUTOSAVE_KEY = 'flowstudio-pipeline-autosave';
let generatedEdgeId = 0;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validatePipelineData(data) {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    return false;
  }

  const nodeIds = new Set();
  for (const node of data.nodes) {
    if (
      !isPlainObject(node) ||
      typeof node.id !== 'string' ||
      node.id.length === 0 ||
      nodeIds.has(node.id) ||
      typeof node.type !== 'string' ||
      !VALID_NODE_TYPE_SET.has(node.type) ||
      !isPlainObject(node.position) ||
      !Number.isFinite(node.position.x) ||
      !Number.isFinite(node.position.y) ||
      !isPlainObject(node.data)
    ) {
      return false;
    }
    nodeIds.add(node.id);
  }

  const edgeIds = new Set();
  for (const edge of data.edges) {
    if (
      !isPlainObject(edge) ||
      typeof edge.id !== 'string' ||
      edge.id.length === 0 ||
      edgeIds.has(edge.id) ||
      typeof edge.source !== 'string' ||
      typeof edge.target !== 'string' ||
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target) ||
      (edge.sourceHandle !== undefined && edge.sourceHandle !== null && typeof edge.sourceHandle !== 'string') ||
      (edge.targetHandle !== undefined && edge.targetHandle !== null && typeof edge.targetHandle !== 'string')
    ) {
      return false;
    }
    edgeIds.add(edge.id);
  }

  return true;
}

function nextEdgeId(source, target) {
  generatedEdgeId += 1;
  return `e-${source}-${target}-${Date.now()}-${generatedEdgeId}`;
}

function snap(state) {
  return { nodes: structuredClone(state.nodes), edges: structuredClone(state.edges) };
}

function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (validatePipelineData(data)) return data;
    }
  } catch {}
  return null;
}

let autosaveTimer = null;
function scheduleAutosave(state) {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    try {
      localStorage.setItem(
        AUTOSAVE_KEY,
        JSON.stringify({ nodes: state.nodes, edges: state.edges }),
      );
    } catch {}
  }, 1000);
}

function rebuildNodeIDs(nodes) {
  const ids = {};
  for (const node of nodes) {
    const match = node.id.match(/^(.+)-(\d+)$/);
    if (match) {
      const type = match[1];
      const num = parseInt(match[2], 10);
      ids[type] = Math.max(ids[type] ?? 0, num);
    }
  }
  return ids;
}

const saved = loadAutosave();

export const useStore = createWithEqualityFn((set, get) => ({
  nodes: saved?.nodes ?? [],
  edges: saved?.edges ?? [],
  nodeIDs: saved?.nodes ? rebuildNodeIDs(saved.nodes) : {},

  // ── Undo / Redo ──────────────────────────────────────────────────────────
  past: [],
  future: [],

  pushHistory: () => {
    const s = get();
    set({
      past: [...s.past.slice(-(MAX_HISTORY - 1)), snap(s)],
      future: [],
    });
  },

  undo: () => {
    const { past, nodes, edges } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [snap({ nodes, edges }), ...get().future].slice(0, MAX_HISTORY),
      nodes: prev.nodes,
      edges: prev.edges,
    });
  },

  redo: () => {
    const { future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      future: future.slice(1),
      past: [...get().past, snap({ nodes, edges })].slice(-MAX_HISTORY),
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  // ── Node IDs ─────────────────────────────────────────────────────────────
  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) newIDs[type] = 0;
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },

  // ── CRUD ─────────────────────────────────────────────────────────────────
  addNode: (node) => {
    get().pushHistory();
    set({ nodes: [...get().nodes, node] });
  },

  deleteNode: (nodeId) => {
    get().pushHistory();
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
    });
  },

  deleteElements: (nodeIds, edgeIds) => {
    get().pushHistory();
    const nSet = new Set(nodeIds);
    const eSet = new Set(edgeIds);
    set({
      nodes: get().nodes.filter((n) => !nSet.has(n.id)),
      edges: get().edges.filter(
        (e) =>
          !eSet.has(e.id) && !nSet.has(e.source) && !nSet.has(e.target),
      ),
    });
  },

  onNodesChange: (changes) => {
    const isStructural = changes.some((c) => c.type === 'remove');
    if (isStructural) get().pushHistory();
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    const isStructural = changes.some((c) => c.type === 'remove');
    if (isStructural) get().pushHistory();
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get().pushHistory();
    // One connection per input handle: a new wire into an already-connected
    // target handle replaces the old one (addEdge also dedupes exact repeats).
    const pruned = get().edges.filter(
      (e) =>
        !(
          e.target === connection.target &&
          e.targetHandle === connection.targetHandle
        ),
    );
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: false,
          markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
        },
        pruned,
      ),
    });
  },

  // Immutable field update.
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, [fieldName]: fieldValue } }
          : node,
      ),
    });
  },

  // Atomic text-node content update with edge garbage collection.
  setTextNodeContent: (nodeId, text) => {
    const variables = parseVariables(text);
    const validHandleIds = new Set(
      variables.map((v) => `${nodeId}-var-${v}`),
    );
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, text, variables } }
          : node,
      ),
      edges: get().edges.filter((edge) => {
        if (edge.target !== nodeId) return true;
        if (!edge.targetHandle) return true;
        if (!edge.targetHandle.startsWith(`${nodeId}-var-`)) return true;
        return validHandleIds.has(edge.targetHandle);
      }),
    });
  },

  // Atomic merge-node input count update with edge garbage collection.
  setMergeInputCount: (nodeId, count) => {
    const validHandleIds = new Set(
      Array.from({ length: count }, (_, i) => `${nodeId}-in-${i}`),
    );
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, inputCount: count } }
          : node,
      ),
      edges: get().edges.filter((edge) => {
        if (edge.target !== nodeId) return true;
        if (!edge.targetHandle) return true;
        if (!edge.targetHandle.startsWith(`${nodeId}-in-`)) return true;
        return validHandleIds.has(edge.targetHandle);
      }),
    });
  },

  // ── Clipboard ────────────────────────────────────────────────────────────
  clipboard: null,

  copyNodes: (nodeIds) => {
    const nodes = get().nodes.filter((n) => nodeIds.includes(n.id));
    const nSet = new Set(nodeIds);
    const edges = get().edges.filter(
      (e) => nSet.has(e.source) && nSet.has(e.target),
    );
    set({ clipboard: { nodes: structuredClone(nodes), edges: structuredClone(edges) } });
  },

  pasteNodes: (offset = { x: 40, y: 40 }) => {
    const { clipboard } = get();
    if (!clipboard || clipboard.nodes.length === 0) return;
    get().pushHistory();

    const idMap = {};
    const newNodes = clipboard.nodes.map((n) => {
      const newId = get().getNodeID(n.type);
      idMap[n.id] = newId;
      return {
        ...n,
        id: newId,
        position: { x: n.position.x + offset.x, y: n.position.y + offset.y },
        data: { ...n.data, id: newId },
        selected: true,
      };
    });
    // Handle ids are `${nodeId}-${suffix}`; rebase the prefix onto the new node
    // so duplicated connected nodes don't keep wiring back to the originals.
    const remapHandle = (handle, oldNodeId) => {
      const newNodeId = idMap[oldNodeId];
      if (!handle || !newNodeId) return handle;
      return handle.startsWith(`${oldNodeId}-`)
        ? `${newNodeId}${handle.slice(oldNodeId.length)}`
        : handle;
    };
    const newEdges = clipboard.edges
      .filter((e) => idMap[e.source] && idMap[e.target])
      .map((e) => ({
        ...e,
        id: nextEdgeId(idMap[e.source], idMap[e.target]),
        source: idMap[e.source],
        target: idMap[e.target],
        sourceHandle: remapHandle(e.sourceHandle, e.source),
        targetHandle: remapHandle(e.targetHandle, e.target),
      }));

    set({
      nodes: [
        ...get().nodes.map((n) => ({ ...n, selected: false })),
        ...newNodes,
      ],
      edges: [...get().edges, ...newEdges],
    });
  },

  duplicateNodes: (nodeIds) => {
    get().copyNodes(nodeIds);
    get().pasteNodes();
  },

  // ── Pipeline import/export ───────────────────────────────────────────────
  exportPipeline: () => {
    const { nodes, edges } = get();
    // Strip layout-only, underscore-prefixed keys (e.g. _nodeWidth) so the
    // exported pipeline carries domain data, not view state.
    const cleanNodes = nodes.map((n) => {
      const data = {};
      for (const [k, v] of Object.entries(n.data ?? {})) {
        if (!k.startsWith('_')) data[k] = v;
      }
      return { ...n, data };
    });
    return JSON.stringify({ nodes: cleanNodes, edges }, null, 2);
  },

  importPipeline: (json) => {
    let data;
    try {
      data = typeof json === 'string' ? JSON.parse(json) : json;
    } catch {
      return false;
    }
    // Validate structure BEFORE touching history, so a bad import leaves the
    // undo stack untouched.
    if (!validatePipelineData(data)) return false;

    get().pushHistory();
    set({ nodes: data.nodes, edges: data.edges, nodeIDs: rebuildNodeIDs(data.nodes) });
    return true;
  },

  clearPipeline: () => {
    get().pushHistory();
    set({ nodes: [], edges: [] });
  },
}));

// Autosave whenever nodes or edges change.
useStore.subscribe((state) => scheduleAutosave(state));
