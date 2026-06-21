import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubmitButton from '../components/SubmitButton';
import { useStore } from '../store';

function mockFetch(body) {
  return jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(body) }),
  );
}

beforeEach(() => {
  useStore.setState({
    nodes: [{ id: 'a', type: 'customInput', position: { x: 0, y: 0 }, data: {} }],
    edges: [],
  });
  window.alert = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('SubmitButton → ResultDialog', () => {
  it('shows the result dialog with backend stats and fires exactly one alert', async () => {
    global.fetch = mockFetch({ num_nodes: 1, num_edges: 0, is_dag: true });
    render(<SubmitButton />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() =>
      expect(screen.getByText('Valid Pipeline')).toBeInTheDocument(),
    );
    expect(window.alert).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Nodes')).toBeInTheDocument();
    expect(screen.getByText('Edges')).toBeInTheDocument();
    expect(screen.getByText('DAG')).toBeInTheDocument();
  });

  it('restores focus to Submit after closing the result with Escape', async () => {
    global.fetch = mockFetch({ num_nodes: 1, num_edges: 0, is_dag: true });
    render(<SubmitButton />);
    const submit = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submit);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(submit).toHaveFocus();
  });

  it('reflects a cyclic result from the backend', async () => {
    global.fetch = mockFetch({ num_nodes: 2, num_edges: 2, is_dag: false });
    render(<SubmitButton />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() =>
      expect(screen.getByText('Cycle Detected')).toBeInTheDocument(),
    );
  });

  it('shows an error dialog when the request fails', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    render(<SubmitButton />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() =>
      expect(screen.getByText('Analysis Error')).toBeInTheDocument(),
    );
  });
});
