import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import TextNodeBody from '../nodes/text/TextNodeBody';
import { useStore } from '../store';

beforeEach(() => {
  useStore.setState({
    nodes: [
      {
        id: 'text-1',
        type: 'text',
        position: { x: 0, y: 0 },
        data: { text: '', variables: [] },
      },
    ],
    edges: [],
  });
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    font: '',
    measureText: (value) => ({ width: value.length * 8 }),
  }));
});

describe('TextNodeBody', () => {
  it('creates variables and expands its saved layout width as text grows', async () => {
    render(
      <ReactFlowProvider>
        <TextNodeBody id="text-1" data={useStore.getState().nodes[0].data} />
      </ReactFlowProvider>,
    );

    const textarea = screen.getByRole('textbox', { name: 'Text' });
    fireEvent.change(textarea, {
      target: { value: `Hello {{ customer_name }} ${'wide '.repeat(30)}` },
    });

    await waitFor(() => {
      const node = useStore.getState().nodes[0];
      expect(node.data.variables).toEqual(['customer_name']);
      expect(node.data._nodeWidth).toBe(480);
    });
  });

  it('caps textarea height and enables scrolling for long content', () => {
    render(
      <ReactFlowProvider>
        <TextNodeBody id="text-1" data={useStore.getState().nodes[0].data} />
      </ReactFlowProvider>,
    );
    const textarea = screen.getByRole('textbox', { name: 'Text' });
    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 500 });
    fireEvent.change(textarea, { target: { value: 'line\n'.repeat(80) } });
    expect(textarea.style.height).toBe('240px');
    expect(textarea.style.overflowY).toBe('auto');
  });
});
