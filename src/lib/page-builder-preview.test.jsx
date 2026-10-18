// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import StorePageBuilderPage from '../pages/StorePageBuilderPage';
import api from '../api/client';

const page = { id: 11, title: 'Own funnel', slug: 'own-funnel', preview_path: '/funnels/own-funnel', public_path: '/funnels/own-funnel', template: 'landing', locale: 'en', sections: [{ id: 1, type: 'glasses-hero', settings: { heading: 'Own campaign' }, is_visible: true }, { id: 2, type: 'glasses-faq', settings: {}, is_visible: false }] };
vi.mock('react-router-dom', () => ({ useParams: () => ({ pageId: '11' }), useNavigate: () => vi.fn(), useOutletContext: () => ({ permissions: ['store.pages.manage'] }), Navigate: () => null }));
vi.mock('../hooks/useStoreScope', () => ({ default: () => ({ apiBase: '/my-store', uiBase: '/store' }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (_key, fallback) => fallback }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../components/ui/SearchableSelect', () => ({ default: props => <select {...props} /> }));
vi.mock('../components/store/StoreMediaPicker', () => ({ default: () => null }));
vi.mock('../api/client', () => ({ default: {
  get: async path => ({ data: path.endsWith('/schema') ? { sections_schema: { 'glasses-hero': { settings: [] }, 'glasses-faq': { settings: [] } } } : { data: path.endsWith('/revisions') ? [] : page } }),
  post: async () => ({ data: { preview_url: 'https://own-shop.example/funnels/own-funnel?__preview=local-test-capability' } }),
  put: async () => ({ data: { data: page } }),
} }));

let host; let root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.useRealTimers(); });
async function mount() { await act(async () => { root.render(<StorePageBuilderPage />); }); return host.querySelector('iframe'); }
function ready(frame, origin = 'https://own-shop.example', source = frame.contentWindow) { window.dispatchEvent(new MessageEvent('message', { source, origin, data: { channel: 'sellchaze-theme-preview', version: 1, type: 'ready' } })); }

it('waits for the child application handshake before sending drafts and enables customize mode', async () => {
  const frame = await mount(); const post = vi.spyOn(frame.contentWindow, 'postMessage');
  expect(new URL(frame.src).searchParams.get('customize')).toBe('1');
  expect(post).not.toHaveBeenCalled();
  await act(async () => ready(frame));
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ type: 'hydrate', payload: expect.objectContaining({ path: '/funnels/own-funnel', sections: [expect.objectContaining({ id: '1', type: 'glasses-hero' })] }) }), 'https://own-shop.example');
});

it('ignores preview handshakes from another origin or window', async () => {
  const frame = await mount(); const post = vi.spyOn(frame.contentWindow, 'postMessage');
  await act(async () => { ready(frame, 'https://other-shop.example'); ready(frame, 'https://own-shop.example', window); });
  expect(post).not.toHaveBeenCalled();
});

it('keeps the live child mounted while autosaving an edited layout', async () => {
  vi.useFakeTimers();
  const saved = vi.spyOn(api, 'put'); const frame = await mount();
  await act(async () => ready(frame));
  const add = Array.from(host.querySelectorAll('button')).find(button => button.textContent === 'glasses-hero');
  await act(async () => add.click());
  await act(async () => vi.advanceTimersByTimeAsync(901));
  expect(saved).toHaveBeenCalledWith('/my-store/pages/11/sections', expect.objectContaining({ sections: expect.arrayContaining([expect.objectContaining({ type: 'glasses-hero' })]) }));
  expect(host.querySelector('iframe')).toBe(frame);
  expect(frame.isConnected).toBe(true);
});
