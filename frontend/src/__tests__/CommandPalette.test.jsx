import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommandPalette from '../components/CommandPalette';

describe('CommandPalette focus management', () => {
  it('traps reverse tab navigation and closes on Escape from anywhere', async () => {
    const onClose = jest.fn();
    render(
      <CommandPalette
        open
        onClose={onClose}
        onSelectNode={jest.fn()}
      />,
    );

    const search = screen.getByRole('combobox', { name: 'Search nodes' });
    await waitFor(() => expect(search).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    const options = screen.getAllByRole('option');
    expect(options[options.length - 1]).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
