// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { BuilderPage } from './BuilderPage';
const state = vi.hoisted(() => ({ result: { loading: false, error: null, data: null } as unknown }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ slug: 'own-page' }) }));
vi.mock('../api/useAsync', () => ({ useAsync: () => state.result }));
vi.mock('../api/storefront', () => ({ getPage: vi.fn(), getFunnel: vi.fn() }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { defaultLocale: 'en' } }) }));
vi.mock('../customize/customizer-state', () => ({ useCustomizerState: () => ({ active: false }), useCustomizerSections: () => null }));
vi.mock('./home-context', () => ({ useHomeContext: () => ({ context: {} }) }));
vi.mock('./HomePage', () => ({ toSectionInstances: (value: unknown) => value }));
vi.mock('../theme-engine', () => ({ ThemeRenderer: () => <div>Published sections</div> }));
vi.mock('../seo/Seo', () => ({ Seo: () => null }));
vi.mock('./StaticPages', () => ({ PolicyPage: () => <div>Policy fallback</div> }));
vi.mock('./NotFoundPage', () => ({ NotFoundPage: () => <div>Page not found</div> }));
vi.mock('./FunnelCheckout', () => ({ FunnelCheckout: ({ productSlug }: { productSlug: string }) => <div data-product={productSlug}>Real funnel checkout</div> }));
let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
function publication(extra = {}) { state.result = { loading: false, error: null, data: { locale: 'en', data: { data: { id: 23, slug: 'own-page', title: 'Own published page', template: 'page', sections: [], ...extra } } } }; }
it('renders the title of an existing empty published page instead of a false missing-page fallback', async () => {
  publication(); await act(async () => root.render(<BuilderPage />));
  expect(host.querySelector('h1')?.textContent).toBe('Own published page'); expect(host.textContent).not.toContain('fallback'); expect(host.textContent).not.toContain('not found');
});
it('keeps an empty published funnel connected to its actual configured product', async () => {
  publication({ funnel_product_slug: 'own-product' }); await act(async () => root.render(<BuilderPage funnel />));
  expect(host.querySelector('[data-product]')?.getAttribute('data-product')).toBe('own-product'); expect(host.textContent).not.toContain('not found');
});
it('retains the missing-page behavior when there is no matching publication', async () => {
  state.result = { loading: false, error: null, data: null }; await act(async () => root.render(<BuilderPage />)); expect(host.textContent).toBe('Policy fallback');
  await act(async () => root.render(<BuilderPage funnel />)); expect(host.textContent).toBe('Page not found');
});
