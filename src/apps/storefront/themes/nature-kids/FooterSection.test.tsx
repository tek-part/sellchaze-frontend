// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { NatureFooterSection } from './FooterSection';
it('keeps desktop footer links available after resizing a closed phone group and supports reopening on phone', async () => {
 (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true;
 let phone = true; const listeners = new Set<() => void>();
 vi.stubGlobal('matchMedia', () => ({ get matches() { return phone; }, addEventListener: (_event: string, callback: () => void) => listeners.add(callback), removeEventListener: (_event: string, callback: () => void) => listeners.delete(callback) }));
 const container = document.createElement('div'); document.body.appendChild(container); const root = createRoot(container);
 try {
  await act(async () => root.render(createElement(NatureFooterSection, { title: 'Shop', collapsible: true, asNav: true, children: createElement('a', { href: '/shop' }, 'All products') })));
  const button = container.querySelector('button')!; const panel = document.getElementById(button.getAttribute('aria-controls')!)!;
  expect(button.getAttribute('aria-expanded')).toBe('false'); expect(panel.hidden).toBe(true);
  await act(async () => { phone = false; for (const callback of listeners) callback(); });
  expect(container.querySelector('button')).toBeNull(); expect(panel.hidden).toBe(false); expect(panel.querySelector('a')?.getAttribute('href')).toBe('/shop');
  await act(async () => { phone = true; for (const callback of listeners) callback(); });
  await act(async () => container.querySelector('button')!.click());
  expect(container.querySelector('button')?.getAttribute('aria-expanded')).toBe('true'); expect(panel.hidden).toBe(false);
 } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
