import { useStore } from '../store';

beforeEach(() => {
  useStore.setState({
    nodes: [],
    edges: [],
    nodeIDs: {},
    past: [],
    future: [],
    clipboard: null,
  });
});

describe('getNodeID', () => {
  it('generates sequential IDs per type', () => {
    const { getNodeID } = useStore.getState();
    expect(getNodeID('text')).toBe('text-1');
    expect(getNodeID('text')).toBe('text-2');
    expect(getNodeID('llm')).toBe('llm-1');
  });

  it('never produces duplicate IDs', () => {
    const { getNodeID } = useStore.getState();
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(getNodeID('input'));
    }
    expect(ids.size).toBe(100);
  });
});

describe('addNode / deleteNode', () => {
  it('adds a node to the store', () => {
    const { addNode } = useStore.getState();
    addNode({ id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: {} });
    expect(useStore.getState().nodes).toHaveLength(1);
    expect(useStore.getState().nodes[0].id).toBe('text-1');
  });

  it('deletes a node and its connected edges', () => {
    useStore.setState({
      nodes: [
        { id: 'a', type: 'input', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'output', position: { x: 100, y: 0 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b' }],
    });
    useStore.getState().deleteNode('a');
    const state = useStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe('b');
    expect(state.edges).toHaveLength(0);
  });
});

describe('setTextNodeContent', () => {
  it('updates text and variables on a node', () => {
    useStore.setState({
      nodes: [{ id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: { text: '', variables: [] } }],
      edges: [],
    });
    useStore.getState().setTextNodeContent('text-1', 'Hello {{ name }}');
    const node = useStore.getState().nodes[0];
    expect(node.data.text).toBe('Hello {{ name }}');
    expect(node.data.variables).toEqual(['name']);
  });

  it('prunes edges to removed variable handles', () => {
    useStore.setState({
      nodes: [{ id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: { text: '{{ a }} {{ b }}', variables: ['a', 'b'] } }],
      edges: [
        { id: 'e1', source: 'in-1', target: 'text-1', targetHandle: 'text-1-var-a' },
        { id: 'e2', source: 'in-2', target: 'text-1', targetHandle: 'text-1-var-b' },
      ],
    });
    useStore.getState().setTextNodeContent('text-1', '{{ a }}');
    const edges = useStore.getState().edges;
    expect(edges).toHaveLength(1);
    expect(edges[0].targetHandle).toBe('text-1-var-a');
  });
});

describe('setMergeInputCount', () => {
  it('prunes edges to removed merge handles', () => {
    useStore.setState({
      nodes: [{ id: 'merge-1', type: 'merge', position: { x: 0, y: 0 }, data: { inputCount: 4 } }],
      edges: [
        { id: 'e0', source: 'x', target: 'merge-1', targetHandle: 'merge-1-in-0' },
        { id: 'e1', source: 'x', target: 'merge-1', targetHandle: 'merge-1-in-1' },
        { id: 'e2', source: 'x', target: 'merge-1', targetHandle: 'merge-1-in-2' },
        { id: 'e3', source: 'x', target: 'merge-1', targetHandle: 'merge-1-in-3' },
      ],
    });
    useStore.getState().setMergeInputCount('merge-1', 2);
    const state = useStore.getState();
    expect(state.nodes[0].data.inputCount).toBe(2);
    expect(state.edges).toHaveLength(2);
    expect(state.edges.map((e) => e.targetHandle)).toEqual(['merge-1-in-0', 'merge-1-in-1']);
  });
});

describe('undo / redo', () => {
  it('restores previous state on undo', () => {
    const { addNode } = useStore.getState();
    addNode({ id: 'a', type: 'input', position: { x: 0, y: 0 }, data: {} });
    addNode({ id: 'b', type: 'output', position: { x: 100, y: 0 }, data: {} });
    expect(useStore.getState().nodes).toHaveLength(2);
    useStore.getState().undo();
    expect(useStore.getState().nodes).toHaveLength(1);
  });

  it('redo restores undone state', () => {
    const { addNode } = useStore.getState();
    addNode({ id: 'a', type: 'input', position: { x: 0, y: 0 }, data: {} });
    useStore.getState().undo();
    expect(useStore.getState().nodes).toHaveLength(0);
    useStore.getState().redo();
    expect(useStore.getState().nodes).toHaveLength(1);
  });
});

describe('importPipeline', () => {
  it('restores nodes and edges from JSON', () => {
    const json = JSON.stringify({
      nodes: [{ id: 'text-5', type: 'text', position: { x: 0, y: 0 }, data: {} }],
      edges: [],
    });
    const result = useStore.getState().importPipeline(json);
    expect(result).toBe(true);
    expect(useStore.getState().nodes).toHaveLength(1);
  });

  it('rebuilds nodeIDs so next ID does not collide', () => {
    useStore.getState().importPipeline(
      JSON.stringify({
        nodes: [{ id: 'text-3', type: 'text', position: { x: 0, y: 0 }, data: {} }],
        edges: [],
      }),
    );
    const nextId = useStore.getState().getNodeID('text');
    expect(nextId).toBe('text-4');
  });

  it('rejects invalid JSON', () => {
    expect(useStore.getState().importPipeline('not json')).toBe(false);
  });

  it('rejects objects missing nodes/edges', () => {
    expect(useStore.getState().importPipeline(JSON.stringify({ foo: 1 }))).toBe(false);
  });
});

describe('importPipeline validation', () => {
  it('rejects non-array nodes', () => {
    expect(
      useStore.getState().importPipeline(JSON.stringify({ nodes: {}, edges: [] })),
    ).toBe(false);
  });

  it('rejects unknown node types', () => {
    expect(
      useStore.getState().importPipeline(
        JSON.stringify({
          nodes: [{ id: 'x-1', type: 'bogus', position: { x: 0, y: 0 } }],
          edges: [],
        }),
      ),
    ).toBe(false);
  });

  it('rejects nodes missing a numeric position', () => {
    expect(
      useStore.getState().importPipeline(
        JSON.stringify({ nodes: [{ id: 'text-1', type: 'text' }], edges: [] }),
      ),
    ).toBe(false);
  });

  it('rejects edges missing source/target', () => {
    expect(
      useStore.getState().importPipeline(
        JSON.stringify({
          nodes: [{ id: 'text-1', type: 'text', position: { x: 0, y: 0 } }],
          edges: [{ id: 'e1', source: 'text-1' }],
        }),
      ),
    ).toBe(false);
  });

  it('does not add a history entry when import fails', () => {
    useStore.setState({ past: [] });
    useStore.getState().importPipeline('not json');
    useStore.getState().importPipeline(JSON.stringify({ nodes: 'x', edges: [] }));
    expect(useStore.getState().past).toHaveLength(0);
  });

  it('rejects nodes without a data object', () => {
    expect(
      useStore.getState().importPipeline(
        JSON.stringify({
          nodes: [{ id: 'text-1', type: 'text', position: { x: 0, y: 0 } }],
          edges: [],
        }),
      ),
    ).toBe(false);
  });

  it('rejects duplicate node ids', () => {
    const node = { id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: {} };
    expect(
      useStore.getState().importPipeline(
        JSON.stringify({ nodes: [node, { ...node }], edges: [] }),
      ),
    ).toBe(false);
  });

  it('rejects edges that reference nodes outside the import', () => {
    expect(
      useStore.getState().importPipeline(
        JSON.stringify({
          nodes: [{ id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: {} }],
          edges: [{ id: 'e1', source: 'ghost', target: 'text-1' }],
        }),
      ),
    ).toBe(false);
  });
});

describe('pasteNodes handle remapping', () => {
  it('rebases source/target handle ids onto the new node ids', () => {
    useStore.setState({
      nodes: [],
      edges: [],
      nodeIDs: { customInput: 5, llm: 7 },
      clipboard: {
        nodes: [
          { id: 'customInput-1', type: 'customInput', position: { x: 0, y: 0 }, data: {} },
          { id: 'llm-1', type: 'llm', position: { x: 200, y: 0 }, data: {} },
        ],
        edges: [
          {
            id: 'e1',
            source: 'customInput-1',
            target: 'llm-1',
            sourceHandle: 'customInput-1-value',
            targetHandle: 'llm-1-prompt',
          },
        ],
      },
    });
    useStore.getState().pasteNodes();
    const { nodes, edges } = useStore.getState();
    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
    const newInput = nodes.find((n) => n.type === 'customInput').id;
    const newLlm = nodes.find((n) => n.type === 'llm').id;
    expect(newInput).toBe('customInput-6');
    expect(newLlm).toBe('llm-8');
    expect(edges[0].source).toBe(newInput);
    expect(edges[0].target).toBe(newLlm);
    expect(edges[0].sourceHandle).toBe(`${newInput}-value`);
    expect(edges[0].targetHandle).toBe(`${newLlm}-prompt`);
  });

  it('assigns unique ids to multiple edges between the same node pair', () => {
    useStore.setState({
      nodes: [],
      edges: [],
      nodeIDs: { customInput: 1, llm: 1 },
      clipboard: {
        nodes: [
          { id: 'customInput-1', type: 'customInput', position: { x: 0, y: 0 }, data: {} },
          { id: 'llm-1', type: 'llm', position: { x: 200, y: 0 }, data: {} },
        ],
        edges: [
          { id: 'e1', source: 'customInput-1', target: 'llm-1', targetHandle: 'llm-1-system' },
          { id: 'e2', source: 'customInput-1', target: 'llm-1', targetHandle: 'llm-1-prompt' },
        ],
      },
    });

    useStore.getState().pasteNodes();
    const ids = useStore.getState().edges.map((edge) => edge.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('onConnect guardrails', () => {
  const baseNodes = [
    { id: 'a', type: 'customInput', position: { x: 0, y: 0 }, data: {} },
    { id: 'b', type: 'customInput', position: { x: 0, y: 0 }, data: {} },
    { id: 'c', type: 'llm', position: { x: 0, y: 0 }, data: {} },
  ];

  it('replaces an existing edge into the same target handle', () => {
    useStore.setState({
      nodes: baseNodes,
      edges: [
        { id: 'e1', source: 'a', target: 'c', sourceHandle: 'a-value', targetHandle: 'c-prompt' },
      ],
    });
    useStore.getState().onConnect({
      source: 'b',
      target: 'c',
      sourceHandle: 'b-value',
      targetHandle: 'c-prompt',
    });
    const edges = useStore.getState().edges;
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('b');
    expect(edges[0].targetHandle).toBe('c-prompt');
  });

  it('keeps edges into different target handles', () => {
    useStore.setState({
      nodes: baseNodes,
      edges: [
        { id: 'e1', source: 'a', target: 'c', sourceHandle: 'a-value', targetHandle: 'c-system' },
      ],
    });
    useStore.getState().onConnect({
      source: 'b',
      target: 'c',
      sourceHandle: 'b-value',
      targetHandle: 'c-prompt',
    });
    expect(useStore.getState().edges).toHaveLength(2);
  });
});

describe('exportPipeline', () => {
  it('strips underscore-prefixed layout keys', () => {
    useStore.setState({
      nodes: [
        { id: 'text-1', type: 'text', position: { x: 0, y: 0 }, data: { text: 'hi', _nodeWidth: 400 } },
      ],
      edges: [],
    });
    const json = JSON.parse(useStore.getState().exportPipeline());
    expect(json.nodes[0].data.text).toBe('hi');
    expect(json.nodes[0].data._nodeWidth).toBeUndefined();
  });
});
