import { useState, useRef, useCallback, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { buildNodeTypes, getInitData } from './nodes/registry';
import { isDag } from './lib/graph';
import EmptyState from './components/EmptyState';
import ContextMenu from './components/ContextMenu';
import { useToast } from './components/Toaster';
import { useTheme } from './components/ThemeToggle';
import { Copy, Trash2, ClipboardPaste, CopyPlus } from 'lucide-react';

import 'reactflow/dist/style.css';

const gridSize = 20;
const CASCADE_COLUMN_GAP = 380;
const CASCADE_ROW_GAP = 460;
const CASCADE_IDLE_RESET_MS = 1100;
const NODE_COLLISION_GAP = 44;

function estimatedNodeSize(type, node) {
  if (node) {
    return {
      width: node.data?._nodeWidth ?? node.measured?.width ?? node.width ?? 300,
      height: node.measured?.height ?? node.height ?? (node.type === 'text' ? 420 : 280),
    };
  }
  return {
    width: type === 'text' ? 480 : 300,
    height: type === 'text' ? 420 : type === 'merge' ? 360 : 280,
  };
}

function overlapsExisting(position, size, nodes) {
  return nodes.some((node) => {
    const existing = estimatedNodeSize(node.type, node);
    return !(
      position.x + size.width + NODE_COLLISION_GAP <= node.position.x ||
      node.position.x + existing.width + NODE_COLLISION_GAP <= position.x ||
      position.y + size.height + NODE_COLLISION_GAP <= node.position.y ||
      node.position.y + existing.height + NODE_COLLISION_GAP <= position.y
    );
  });
}

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  clipboard: state.clipboard,
  copyNodes: state.copyNodes,
  pasteNodes: state.pasteNodes,
  duplicateNodes: state.duplicateNodes,
  deleteNode: state.deleteNode,
});

export const PipelineUI = forwardRef(function PipelineUI(props, ref) {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    clipboard,
    copyNodes,
    pasteNodes,
    duplicateNodes,
    deleteNode,
  } = useStore(selector, shallow);

  const nodeTypes = useMemo(() => buildNodeTypes(), []);
  const toast = useToast();
  const { theme } = useTheme();

  const isValidConnection = useCallback(
    (connection) => connection.source !== connection.target,
    [],
  );

  // Wrap onConnect so we can warn the instant a wire introduces a cycle.
  const handleConnect = useCallback(
    (connection) => {
      const before = useStore.getState();
      const wasDag = isDag(before.nodes, before.edges);
      onConnect(connection);
      const { nodes: n, edges: ed } = useStore.getState();
      if (wasDag && !isDag(n, ed)) {
        toast('Heads up: this connection creates a cycle.', 'warning');
      }
    },
    [onConnect, toast],
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        let appData;
        try {
          appData = JSON.parse(
            event.dataTransfer.getData('application/reactflow'),
          );
        } catch {
          toast('That dragged item is not a valid pipeline node.', 'error');
          return;
        }
        const type = appData?.nodeType;
        if (typeof type === 'undefined' || !type) return;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        addNode({
          id: nodeID,
          type,
          position,
          data: getInitData(type, nodeID),
        });
      }
    },
    [reactFlowInstance, getNodeID, addNode, toast],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Right-click on a node
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        items: [
          {
            label: 'Duplicate',
            icon: CopyPlus,
            shortcut: 'Ctrl+D',
            action: () => duplicateNodes([node.id]),
          },
          {
            label: 'Copy',
            icon: Copy,
            shortcut: 'Ctrl+C',
            action: () => copyNodes([node.id]),
          },
          { separator: true },
          {
            label: 'Delete',
            icon: Trash2,
            shortcut: 'Del',
            action: () => deleteNode(node.id),
          },
        ],
      });
    },
    [duplicateNodes, copyNodes, deleteNode],
  );

  // Right-click on the canvas
  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        items: [
          {
            label: 'Paste',
            icon: ClipboardPaste,
            shortcut: 'Ctrl+V',
            action: () => pasteNodes(),
            disabled: !clipboard,
          },
        ],
      });
    },
    [pasteNodes, clipboard],
  );

  const cascadeBase = useRef(null);
  const cascadeResetTimer = useRef(null);

  const resetCascade = useCallback(() => {
    cascadeBase.current = null;
    if (cascadeResetTimer.current) {
      clearTimeout(cascadeResetTimer.current);
      cascadeResetTimer.current = null;
    }
  }, []);

  useEffect(() => resetCascade, [resetCascade]);

  const addNodeAtCenter = useCallback(
    (type) => {
      if (!reactFlowInstance) return;
      // Anchor the cascade to a flow-coordinate origin captured ONCE (re-captured
      // when the canvas is empty). Reading the live viewport per add drifts as
      // React Flow refits, which piled added nodes on top of each other.
      if (cascadeBase.current === null || nodes.length === 0) {
        const { x, y, zoom } = reactFlowInstance.getViewport();
        const wrapper = reactFlowWrapper.current;
        cascadeBase.current = {
          x: (-x + wrapper.clientWidth / 2) / zoom,
          y: (-y + wrapper.clientHeight / 2) / zoom,
        };
      }

      const size = estimatedNodeSize(type);
      const columns = [0, -1, 1];
      let position = null;
      for (let row = 0; row < 20 && !position; row += 1) {
        for (const column of columns) {
          const candidate = {
            x: cascadeBase.current.x + column * CASCADE_COLUMN_GAP - size.width / 2,
            y: cascadeBase.current.y + row * CASCADE_ROW_GAP - size.height / 2,
          };
          if (!overlapsExisting(candidate, size, nodes)) {
            position = candidate;
            break;
          }
        }
      }

      if (!position) {
        position = {
          x: cascadeBase.current.x - size.width / 2,
          y: cascadeBase.current.y + nodes.length * CASCADE_ROW_GAP - size.height / 2,
        };
      }

      const nodeID = getNodeID(type);
      addNode({
        id: nodeID,
        type,
        position,
        data: getInitData(type, nodeID),
      });

      clearTimeout(cascadeResetTimer.current);
      cascadeResetTimer.current = setTimeout(resetCascade, CASCADE_IDLE_RESET_MS);
    },
    [reactFlowInstance, getNodeID, addNode, nodes, resetCascade],
  );

  useImperativeHandle(ref, () => ({ addNodeAtCenter }), [addNodeAtCenter]);

  return (
    <div ref={reactFlowWrapper} className="relative flex-1">
      {nodes.length === 0 && <EmptyState />}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        snapGrid={[gridSize, gridSize]}
        connectionLineType="smoothstep"
        defaultEdgeOptions={{ type: 'smoothstep' }}
        deleteKeyCode={null}
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionKeyCode={null}
        multiSelectionKeyCode={['Meta', 'Shift']}
        onMoveEnd={resetCascade}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView={nodes.length > 0}
        fitViewOptions={{ padding: 0.18, maxZoom: 1.15 }}
        minZoom={0.25}
        maxZoom={1.5}
      >
        <Background
          variant="dots"
          color={theme === 'dark' ? '#475569' : '#d1d5db'}
          gap={gridSize}
          size={1.5}
        />
        <Controls position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={theme === 'dark' ? '#475569' : '#e5e7eb'}
          maskColor={theme === 'dark' ? 'rgba(15,23,42,0.72)' : 'rgba(247,248,250,0.7)'}
          style={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' }}
          pannable
          zoomable
        />
      </ReactFlow>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});
