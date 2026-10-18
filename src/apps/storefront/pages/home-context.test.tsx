import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ response: undefined as unknown, apiOk: true, loading: false, error: null as Error | null, fetcher: null as (() => Promise<unknown>) | null }));
vi.mock('../preview', () => ({ previewOrDev: () => true }));
vi.mock('../theme-engine', () => ({ useThemeManifest: () => ({ id: 'hype-fashion' }) }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ apiOk: fixture.apiOk, store: { id: 'merchant', name: 'Merchant', currency: 'USD', defaultLocale: 'en', currencyMultipliers: { USD: 1 } } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../api/useAsync', () => ({ useAsync: (fetcher: () => Promise<unknown>) => {
  fixture.fetcher = fetcher;
  return { data: fixture.response, loading: fixture.loading, error: fixture.error };
} }));
vi.mock('../api/storefront', () => ({ getHome: vi.fn(async () => ({ data: {} })) }));
vi.mock('../dev/sampleData', () => {
  const products = [{ id: 'preview', handle: 'preview', title: 'Preview only', price: 100, currency: 'USD', url: '/products/preview' }];
  return { sampleNewest: () => products, sampleFeatured: () => products, sampleCategories: () => [] };
});
import { useHomeContext } from './home-context';
import { getHome } from '../api/storefront';
function Probe() {
  const { context, loading } = useHomeContext();
  const collections = context.data['collections'] as Record<string, ReadonlyArray<unknown>>;
  return createElement('output', null, `featured:${collections['featured']?.length}|all:${collections['all']?.length}|busy:${loading}|sectionBusy:${context.data['loading']}|error:${!!context.data['error']}`);
}
beforeEach(() => { vi.clearAllMocks(); fixture.response = undefined; fixture.apiOk = true; fixture.loading = false; fixture.error = null; fixture.fetcher = null; });
it('preserves an authoritative empty merchant catalog even when demo preview is allowed', () => {
  fixture.response = { data: { products: [], categories: [], best_sellers: [], new_arrivals: [], on_sale: [], trending: [], collections: [], brands: [], coupons: [] } };
  expect(renderToStaticMarkup(createElement(Probe))).toContain('featured:0|all:0');
});
it('renders an isolated preview immediately without requesting a merchant home bundle', async () => {
  fixture.apiOk = false; fixture.loading = true;
  expect(renderToStaticMarkup(createElement(Probe))).toContain('featured:1|all:1|busy:false|sectionBusy:false|error:false');
  await fixture.fetcher!();
  expect(getHome).not.toHaveBeenCalled();
});
it('keeps pending merchant data in a loading state without inserting demo products', () => {
  fixture.loading = true;
  expect(renderToStaticMarkup(createElement(Probe))).toContain('featured:0|all:0|busy:true|sectionBusy:true');
});
it('preserves a merchant home error without replacing its catalog with demo products', () => {
  fixture.error = new Error('Merchant home unavailable');
  expect(renderToStaticMarkup(createElement(Probe))).toContain('featured:0|all:0|busy:false|sectionBusy:false|error:true');
});
