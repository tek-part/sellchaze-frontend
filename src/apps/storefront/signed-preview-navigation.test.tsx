// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Link, MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { SignedPreviewNavigation } from './SignedPreviewNavigation';
import { NavigationInterceptor } from './pages/NavigationInterceptor';
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
const token = `Y2F0YWxvZzoxOjI6OTk5OTk5OTk5OQ.${'a'.repeat(64)}`;
let root: Root; let host: HTMLDivElement; let closeMenu = vi.fn<() => void>();
function Routes() {
  const location = useLocation(); const navigate = useNavigate();
  return <><output>{location.pathname}{location.search}</output><Link to="/products/chair" onClick={() => closeMenu()}>Chair</Link><button onClick={() => navigate('/search?q=chair')}>Search</button><a href="https://outside.example" onClick={event => event.preventDefault()}>Outside</a><a href="/shop" target="_blank" onClick={event => event.preventDefault()}>New tab</a></>;
}
beforeEach(() => { (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true; closeMenu = vi.fn<() => void>(); window.history.replaceState({}, '', `/?__preview=${token}`); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); window.history.replaceState({}, '', '/'); });
async function mount(verified = true, search = `?__preview=${token}`) { await act(async () => root.render(<MemoryRouter initialEntries={[`/${search}`]}><SignedPreviewNavigation verified={verified} /><NavigationInterceptor /><Routes /></MemoryRouter>)); }
async function click(element: Element) { await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))); }
describe('signed preview navigation', () => {
  it('keeps the selected preview while normal router links still run their menu close handler', async () => {
    await mount(); await click([...host.querySelectorAll('a')].find(el => el.textContent === 'Chair')!);
    expect(host.querySelector('output')?.textContent).toBe(`/products/chair?__preview=${token}`); expect(closeMenu).toHaveBeenCalledOnce();
  });
  it('restores the capability for programmatic same-document search navigation', async () => {
    await mount(); await click(host.querySelector('button')!); expect(host.querySelector('output')?.textContent).toBe(`/search?q=chair&__preview=${token}`);
  });
  it('leaves outside links untouched and offers a clean exit to the ordinary store', async () => {
    await mount(); const outside = [...host.querySelectorAll('a')].find(el => el.textContent === 'Outside')!; await click(outside);
    expect(outside.getAttribute('href')).toBe('https://outside.example'); expect(host.querySelector('[data-preview-exit]')?.getAttribute('href')).toBe('/');
    const tab = [...host.querySelectorAll('a')].find(el => el.textContent === 'New tab')!; await click(tab); expect(new URL(tab.href).searchParams.get('__preview')).toBe(token);
  });
  it('shows expired/invalid preview feedback', async () => {
    await mount(false); expect(host.querySelector('[role="alert"]')?.textContent).toContain('invalid or has expired');
  });
  it('allows the exit link to reload the active theme instead of being recaptured by shared navigation', async () => {
    await mount(); let intercepted: boolean | undefined;
    // Observe after both document handlers, then suppress jsdom's unsupported
    // document navigation. In a browser this untouched default reloads bootstrap.
    const observe = (event: MouseEvent) => { intercepted = event.defaultPrevented; event.preventDefault(); };
    document.addEventListener('click', observe);
    try {
      await click(host.querySelector('[data-preview-exit]')!);
      expect(intercepted).toBe(false);
      expect(host.querySelector('[data-preview-exit]')?.getAttribute('href')).toBe('/');
    } finally { document.removeEventListener('click', observe); }
  });
  it('leaves ordinary customer navigation and presentation unchanged', async () => {
    window.history.replaceState({}, '', '/'); await mount(true, '');
    expect(host.querySelector('aside')).toBeNull(); await click([...host.querySelectorAll('a')].find(el => el.textContent === 'Chair')!);
    expect(host.querySelector('output')?.textContent).toBe('/products/chair'); expect(closeMenu).toHaveBeenCalledOnce();
  });
});
