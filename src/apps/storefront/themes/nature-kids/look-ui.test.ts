// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { SectionRenderProps } from '../../theme-engine/rendering';
const fixture = vi.hoisted(() => ({ store: '1', lookup: vi.fn() }));
vi.mock('../../state/store-context', () => ({ useStore: () => ({ store: { id: fixture.store, currency: 'EGP', currencyMultipliers: { EGP: 1 } }, apiOk: true }) }));
vi.mock('../../sections-lib/i18n', () => ({ useLocaleCode: () => 'en', useLibT: () => (key: string) => key }));
vi.mock('../../sections-lib/data', async importOriginal => ({ ...await importOriginal<object>(), useSectionData: () => ({ products: () => [], product: () => undefined }) }));
vi.mock('../../api/storefront', () => ({ getCartCatalog: fixture.lookup }));
import { KidsLook } from './sections';
let root: Root; let container: HTMLDivElement;
const props = { instance: { id: 'look', type: 'kids-shop-look' }, settings: { products: [{ product: '92' }, { product: '92' }, { product: '91' }] }, context: { store: { name: 'Test', currency: 'EGP' }, seo: {}, navigation: { header: [], footer: [] }, data: { products: [] } } } as unknown as SectionRenderProps;
const response = (store_id: number, name: string) => ({ store_id, data: [{ id: 92, name, slug: 'outside-home', price: 120, is_active: true }] });
async function render(): Promise<void> { await act(async () => root.render(createElement(KidsLook, props))); }
beforeEach(() => { (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true; fixture.store = '1'; fixture.lookup.mockReset(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it('resolves numeric linked products outside home collections once and omits missing references', async () => {
  fixture.lookup.mockResolvedValue(response(1, 'Selected item')); await render();
  expect(fixture.lookup).toHaveBeenCalledWith([92, 91]); expect(container.querySelectorAll('.nkd-look-products a')).toHaveLength(1); expect(container.textContent).toContain('Selected item');
});
it('rejects a response for another store', async () => {
  fixture.lookup.mockResolvedValue(response(2, 'Foreign item')); await render();
  expect(container.textContent).not.toContain('Foreign item'); expect(container.querySelectorAll('.nkd-look-products a')).toHaveLength(0);
});
it('discards a delayed response after switching stores', async () => {
  let finish!: (value: unknown) => void; fixture.lookup.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue(response(2, 'Current item'));
  await render(); fixture.store = '2'; await render(); await act(async () => finish(response(1, 'Old item')));
  expect(container.textContent).toContain('Current item'); expect(container.textContent).not.toContain('Old item');
});
