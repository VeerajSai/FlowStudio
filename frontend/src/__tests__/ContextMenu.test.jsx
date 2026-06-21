import { render, screen, waitFor } from '@testing-library/react';
import ContextMenu from '../components/ContextMenu';

describe('ContextMenu positioning', () => {
  it('stays inside the viewport near the bottom-right corner', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 240 });
    const rect = { width: 180, height: 96, top: 0, left: 0, right: 180, bottom: 96 };
    const spy = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect);

    render(
      <ContextMenu
        x={310}
        y={230}
        items={[{ label: 'Copy', action: jest.fn() }]}
        onClose={jest.fn()}
      />,
    );

    const menu = screen.getByRole('menu');
    await waitFor(() => {
      expect(menu).toHaveStyle({ left: '132px', top: '136px' });
    });
    spy.mockRestore();
  });
});
