import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ response: undefined as unknown }));
vi.mock('../preview', () => ({ previewOrDev: () => true }));
vi.mock('../theme-engine', () => ({ useThemeManifest: () => ({ id: 'hype-fashion' }) }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { id: 'merchant', name: 'Merchant', currency: 'USD', defaultLocale: 'en', currencyMultipliers: { USD: 1 } } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../api/useAsync', () => ({ useAsync: () => ({ data: fixture.response, loading: false, error: null }) }));
vi.mock('../dev/sampleData', () => {
  const products = [{ id: 'preview', handle: 'preview', title: 'Preview only', price: 100, currency: 'USD', url: '/products/preview' }];
  return { sampleNewest: () => products, sampleFeatured: () => products, sampleCategories: () => [] };
});
import { useHomeContext } from './home-context';
function Probe() {
  const { context } = useHomeContext();
  const collections = context.data['collections'] as Record<string, ReadonlyArray<unknown>>;
  return createElement('output', null, `featured:${collections['featured']?.length}|all:${collections['all']?.length}`);
}
beforeEach(() => { fixture.response = undefined; });
it('preserves an authoritative empty merchant catalog even when demo preview is allowed', () => {
  fixture.response = { data: { products: [], categories: [], best_sellers: [], new_arrivals: [], on_sale: [], trending: [], collections: [], brands: [], coupons: [] } };
  expect(renderToStaticMarkup(createElement(Probe))).toContain('featured:0|all:0');
});
it('still renders the isolated demo when no merchant home response exists', () => {
  expect(renderToStaticMarkup(createElement(Probe))).toContain('featured:1|all:1');
});
