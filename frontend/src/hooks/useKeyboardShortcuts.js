import { useEffect } from 'react';
import { useStore } from '../store';

export default function useKeyboardShortcuts({ onTogglePalette }) {
  useEffect(() => {
    const handler = (e) => {
      const isInput =
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT' ||
        e.target.isContentEditable;

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+K: command palette (always works)
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        onTogglePalette?.();
        return;
      }

      // Don't intercept shortcuts when user is typing in an input
      if (isInput) return;

      // Ctrl+A: select all nodes + edges
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        const { nodes, edges } = useStore.getState();
        useStore.setState({
          nodes: nodes.map((n) => ({ ...n, selected: true })),
          edges: edges.map((ed) => ({ ...ed, selected: true })),
        });
        return;
      }

      // Ctrl+Z: undo
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useStore.getState().undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y: redo
      if ((ctrl && e.shiftKey && e.key === 'z') || (ctrl && e.key === 'y')) {
        e.preventDefault();
        useStore.getState().redo();
        return;
      }

      // Ctrl+D: duplicate selected
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        const selected = useStore
          .getState()
          .nodes.filter((n) => n.selected)
          .map((n) => n.id);
        if (selected.length > 0) {
          useStore.getState().duplicateNodes(selected);
        }
        return;
      }

      // Ctrl+C: copy
      if (ctrl && e.key === 'c') {
        const selected = useStore
          .getState()
          .nodes.filter((n) => n.selected)
          .map((n) => n.id);
        if (selected.length > 0) {
          useStore.getState().copyNodes(selected);
        }
        return;
      }

      // Ctrl+V: paste
      if (ctrl && e.key === 'v') {
        useStore.getState().pasteNodes();
        return;
      }

      // Delete / Backspace: delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { nodes, edges } = useStore.getState();
        const selectedNodes = nodes.filter((n) => n.selected).map((n) => n.id);
        const selectedEdges = edges.filter((e) => e.selected).map((e) => e.id);
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          useStore.getState().deleteElements(selectedNodes, selectedEdges);
        }
        return;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onTogglePalette]);
}
