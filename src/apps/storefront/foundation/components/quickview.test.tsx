// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('./ProductGallery', () => ({ ProductGallery: () => createElement('div', null, 'Gallery') }));
import { QuickView } from './QuickView';
it('provides a named close control for a quick view without a title header', async () => {
  (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0)); vi.stubGlobal('cancelAnimationFrame', clearTimeout);
  const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container); const close = vi.fn();
  try {
    await act(async () => root.render(createElement(QuickView, { open: true, onClose: close, title: 'Fragrance', images: [], children: createElement('p', null, 'Details') })));
    const dialog = document.querySelector('[role=dialog]')!;
    expect(dialog.getAttribute('aria-label')).toBe('Fragrance');
    const button = dialog.querySelector<HTMLButtonElement>('button[aria-label="common.close"]')!;
    expect(button).not.toBeNull(); await act(async () => button.click()); expect(close).toHaveBeenCalledOnce();
    await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))); expect(close).toHaveBeenCalledTimes(2);
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
