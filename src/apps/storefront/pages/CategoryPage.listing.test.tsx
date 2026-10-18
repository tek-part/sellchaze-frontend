// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ theme: 'elite-wallets', request: vi.fn(), context: null as unknown }));
vi.mock('../theme-engine', () => ({ useThemeManifest: () => ({ id: fixture.theme }), useTemplate: () => ({}), ThemeRenderer: ({ context }: { context: unknown }) => { fixture.context = context; return null; } }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { id: 'merchant-1', name: 'Merchant', currency: 'USD', currencyMultipliers: { USD: 1 } } }) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../preview', () => ({ previewOrDev: () => false }));
vi.mock('../api/storefront', () => ({ getCategory: vi.fn(), getProducts: fixture.request }));
vi.mock('../api/mappers', () => ({ toProductCard: (product: { id: number }) => product }));
vi.mock('../seo/Seo', () => ({ Seo: () => null }));
vi.mock('../seo/schema', () => ({ breadcrumbSchema: () => ({}), collectionSchema: () => ({}) }));
import { CategoryPage } from './CategoryPage';
import type { StorefrontContext } from '../theme-engine/rendering';
let container: HTMLDivElement; let root: Root;
function data(): { products: Array<{ id: number }>; listing: { loading: boolean; page: number; lastPage: number; retry: () => void; change: (sort: string, page: number) => void } } { return (fixture.context as StorefrontContext).data as ReturnType<typeof data>; }
beforeEach(() => { (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true; fixture.theme = 'elite-wallets'; fixture.context = null; fixture.request.mockReset(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it('requests twenty products, retains the first page during load more, and resets results for new sorting', async () => {
  let resolvePage!: (value: unknown) => void;
  fixture.request.mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }], meta: { last_page: 2 } });
  await act(async () => root.render(createElement(MemoryRouter, null, createElement(CategoryPage))));
  expect(fixture.request).toHaveBeenLastCalledWith({ perPage: 20, sort: 'rating', page: 1 }); expect(data().products.map(p => p.id)).toEqual([1, 2]);
  fixture.request.mockImplementationOnce(() => new Promise(resolve => { resolvePage = resolve; }));
  await act(async () => data().listing.change('rating', 2));
  expect(data().listing.loading).toBe(true); expect(data().listing.lastPage).toBe(2); expect(data().products.map(p => p.id)).toEqual([1, 2]);
  await act(async () => resolvePage({ data: [{ id: 2 }, { id: 3 }], meta: { last_page: 2 } }));
  expect(data().products.map(p => p.id)).toEqual([1, 2, 3]);
  fixture.request.mockImplementationOnce(() => new Promise(resolve => { resolvePage = resolve; }));
  await act(async () => data().listing.change('price_asc', 1));
  expect(data().products).toEqual([]); expect(fixture.request).toHaveBeenLastCalledWith({ perPage: 20, sort: 'price_asc', page: 1 });
  await act(async () => resolvePage({ data: [{ id: 7 }], meta: { last_page: 1 } })); expect(data().products.map(p => p.id)).toEqual([7]);
});
it('provides the missing Hype Fashion sorting and page controls without switching it to accumulated pages', async () => {
  fixture.theme = 'hype-fashion'; fixture.request.mockResolvedValueOnce({ data: [{ id: 1 }], meta: { last_page: 2 } });
  await act(async () => root.render(createElement(MemoryRouter, null, createElement(CategoryPage))));
  expect(fixture.request).toHaveBeenLastCalledWith({ perPage: 24, sort: 'rating', page: 1 }); expect(data().listing.lastPage).toBe(2);
  fixture.request.mockResolvedValueOnce({ data: [{ id: 2 }], meta: { last_page: 2 } });
  await act(async () => data().listing.change('price_desc', 2)); expect(data().products.map(p => p.id)).toEqual([2]);
});

it('keeps already loaded rows after a failed next page and retries that page in the same scope', async () => {
 fixture.request.mockResolvedValueOnce({ data: [{ id: 1 }], meta: { last_page: 2 } });
 await act(async () => root.render(createElement(MemoryRouter, null, createElement(CategoryPage))));
 fixture.request.mockRejectedValueOnce(new Error('Temporary test failure'));
 await act(async () => data().listing.change('rating', 2)); expect(data().products.map(p => p.id)).toEqual([1]); expect(data().listing.lastPage).toBe(2);
 fixture.request.mockResolvedValueOnce({ data: [{ id: 2 }], meta: { last_page: 2 } });
 await act(async () => data().listing.retry()); expect(data().products.map(p => p.id)).toEqual([1, 2]); expect(fixture.request).toHaveBeenLastCalledWith({ perPage: 20, sort: 'rating', page: 2 });
});
