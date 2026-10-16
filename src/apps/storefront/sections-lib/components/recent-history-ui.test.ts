// @vitest-environment jsdom
import { act, createElement as h, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { RecentlyViewed } from './RecentlyViewed';
import type { SectionRenderProps } from '../../theme-engine/rendering';

const fixture = vi.hoisted(() => ({ catalog: vi.fn() }));
vi.mock('../../api/storefront', () => ({ getCartCatalog: (...args: unknown[]) => fixture.catalog(...args) }));
vi.mock('../../state/store-context', () => ({ useOptionalStore: () => ({ apiOk: true, store: { id: '7', currency: 'EGP', currencyMultipliers: { EGP: 1 } } }) }));
vi.mock('../../state/recently-viewed', () => ({ useRecentlyViewed: () => ({ items: [{ id: '1', title: 'Old hidden' }, { id: '2', title: 'Old price' }, { id: '3', title: 'Inactive' }] }) }));
vi.mock('../i18n', () => ({ useLocaleCode: () => 'en' }));
vi.mock('../use-section', () => ({ useSectionSettings: () => ({}), num: (_s: unknown, key: string) => key === 'min_items' ? 1 : 8, str: () => 'Recent', spacingStyle: () => ({}) }));
vi.mock('../primitives', () => ({ LibSection: ({ children }: { children: ReactNode }) => h('section', null, children), LibCarousel: ({ children }: { children: ReactNode }) => h('div', null, children), LibProductCard: ({ product }: { product: { title: string; price: number } }) => h('p', null, `${product.title}: ${product.price}`) }));
let host: HTMLDivElement; let root: Root;
beforeEach(() => { vi.clearAllMocks(); Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const render = async () => { await act(async () => root.render(h(RecentlyViewed, { settings: {}, context: { data: {} } } as SectionRenderProps))); };
it('refreshes history prices and removes hidden and inactive products before presenting them', async () => {
  fixture.catalog.mockResolvedValue({ store_id: 7, data: [{ id: 1, name: 'Hidden', catalog_hidden: true, price: 100 }, { id: 2, slug: 'live', name: 'Current product', price: 55 }, { id: 3, name: 'Inactive', is_active: false, price: 10 }] });
  await render(); expect(fixture.catalog).toHaveBeenCalledWith([1, 2, 3]); expect(host.textContent).toBe('Current product: 55');
});
it('never displays history returned for a different store', async () => {
  fixture.catalog.mockResolvedValue({ store_id: 99, data: [{ id: 2, slug: 'foreign', name: 'Other store', price: 55 }] });
  await render(); expect(host.textContent).toBe('');
});
it('does not resurrect stale cards when the catalog cannot be revalidated', async () => {
  fixture.catalog.mockRejectedValue(new Error('Offline')); await render(); expect(host.textContent).toBe('');
});
