// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ProductCardModel } from '../../types/catalog';
import type { CartLine } from '../../types/cart';
const fixture = vi.hoisted(() => ({ lines: [] as CartLine[], add: vi.fn(), automatic: false, store: '1', apiOk: true, products: vi.fn() }));
vi.mock('../../state/cart', () => ({ useCart: () => ({ lines: fixture.lines, add: fixture.add, totals: { subtotal: 0, currency: 'EGP' } }) }));
vi.mock('../../state/store-context', () => ({ useVariantSelectionAutomatic: () => fixture.automatic, useStore: () => ({ store: { id: fixture.store, currency: 'EGP', currencyMultipliers: { EGP: 1 } }, apiOk: fixture.apiOk }) }));
vi.mock('../../sections-lib/i18n', () => ({ useLocaleCode: () => 'en' }));
vi.mock('../../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }) }));
vi.mock('../../foundation/components/QuickView', () => ({ QuickView: ({ children }: { children: ReactNode }) => createElement('section', { role: 'dialog' }, children) }));
vi.mock('../nature-kids/CartDrawer', () => ({ KidsCart: ({ open, introduction }: { open: boolean; introduction: ReactNode }) => open ? introduction : null }));
vi.mock('../../api/storefront', () => ({ getProducts: fixture.products }));
import { NaturePetCard } from './Card';
import { NaturePetsCart } from './CartDrawer';
let container: HTMLDivElement; let root: Root;
const product: ProductCardModel = { id: '91', handle: 'bed', title: 'Companion bed', price: 100, currency: 'EGP', url: '/products/bed', variants: [{ id: 'small', label: 'Small', available: true, availableStock: 1, price: 230 }, { id: 'large', label: 'Large', available: false, availableStock: 0, price: 400 }] };
const response = (title: string) => ({ data: [{ id: 92, name: title, slug: 'suggestion', price: 120, is_active: true }] });
beforeEach(() => { (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true; fixture.lines = []; fixture.add.mockReset(); fixture.products.mockReset(); fixture.store = '1'; fixture.apiOk = true; container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it('requires an available option and adds its current price only once stock is reached', async () => {
 await act(async () => root.render(createElement(NaturePetCard, { product, compact: true })));
 await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
 const dialog = container.querySelector('[role=dialog]')!; const add = dialog.querySelector<HTMLButtonElement>('button')!; const select = dialog.querySelector('select')!;
 expect(add.disabled).toBe(true); expect(select.options[2]?.disabled).toBe(true);
 await act(async () => { select.value = 'small'; select.dispatchEvent(new Event('change', { bubbles: true })); });
 expect(add.disabled).toBe(false); expect(dialog.textContent).toContain('230.00');
 await act(async () => add.click()); expect(fixture.add).toHaveBeenCalledWith(expect.objectContaining({ variantId: 'small', price: 230, maxQuantity: 1 }));
 fixture.lines = [{ ...fixture.add.mock.calls[0]![0], quantity: 1 }];
 await act(async () => root.render(createElement(NaturePetCard, { product, compact: true })));
 expect(add.disabled).toBe(true); await act(async () => add.click()); expect(fixture.add).toHaveBeenCalledTimes(1);
});
it('routes personalized products to their full details without offering direct purchase', async () => {
 await act(async () => root.render(createElement(NaturePetCard, { product: { ...product, hasPersonalization: true } })));
 await act(async () => container.querySelector<HTMLButtonElement>('button')!.click());
 const dialog = container.querySelector('[role=dialog]')!; expect(dialog.querySelector('button')).toBeNull(); expect(dialog.querySelector('a')?.getAttribute('href')).toBe('/products/bed'); expect(fixture.add).not.toHaveBeenCalled();
});
it('loads recommendations only when open and preserves an authoritative empty store', async () => {
 fixture.products.mockResolvedValue({ data: [] });
 await act(async () => root.render(createElement(NaturePetsCart, { open: false, close: () => {} }))); expect(fixture.products).not.toHaveBeenCalled();
 await act(async () => root.render(createElement(NaturePetsCart, { open: true, close: () => {} }))); expect(fixture.products).toHaveBeenCalledWith({ perPage: 12 }); expect(container.textContent).toBe('');
});
it('discards delayed recommendations from a previous store', async () => {
 let finish!: (value: unknown) => void; fixture.products.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue(response('Current store item'));
 await act(async () => root.render(createElement(NaturePetsCart, { open: true, close: () => {} })));
 fixture.store = '2'; await act(async () => root.render(createElement(NaturePetsCart, { open: true, close: () => {} })));
 await act(async () => finish(response('Old store item')));
 expect(container.textContent).toContain('Current store item'); expect(container.textContent).not.toContain('Old store item');
});
