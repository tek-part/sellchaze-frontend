// @vitest-environment jsdom
import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ProductCardModel } from '../../types/catalog';
import type { CartLine } from '../../types/cart';
const fixture = vi.hoisted(() => ({ lines: [] as CartLine[], add: vi.fn(), saved: false, toggle: vi.fn() }));
vi.mock('../../state/cart', () => ({ useCart: () => ({ lines: fixture.lines, add: fixture.add }) }));
vi.mock('../../state/store-context', () => ({ useVariantSelectionAutomatic: () => false }));
vi.mock('../../state/wishlist', () => ({ useWishlist: () => ({ has: () => fixture.saved, toggle: fixture.toggle }) }));
vi.mock('../../sections-lib/i18n', () => ({ useLocaleCode: () => 'en' }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'en' } }) }));
vi.mock('../../foundation/components/QuickView', () => ({ QuickView: ({ children }: { children: ReactNode }) => createElement('section', { role: 'dialog' }, children) }));
import { WalletCard as HypeCard, walletVariantForColor } from './Card';
let container: HTMLDivElement; let root: Root;
const product: ProductCardModel = { id: '91', handle: 'amber', title: 'Amber fragrance', price: 100, currency: 'EGP', url: '/products/amber', variants: [{ id: '30', label: '30 ml', available: true, availableStock: 1, price: 230 }, { id: '50', label: '50 ml', available: false, availableStock: 0, price: 400 }] };
beforeEach(() => { (globalThis as Record<string, unknown>)['IS_REACT_ACT_ENVIRONMENT'] = true; fixture.lines = []; fixture.add.mockReset(); fixture.saved = false; fixture.toggle.mockReset(); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it('opens option selection before adding and enforces the selected variant price and stock cap', async () => {
  await act(async () => root.render(createElement(HypeCard, { product })));
  expect(container.querySelector('a button')).toBeNull();
  await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label^="Choose options"]')!.click()); expect(fixture.add).not.toHaveBeenCalled();
  const dialog = container.querySelector('[role=dialog]')!; const select = dialog.querySelector('select')!; const add = dialog.querySelector<HTMLButtonElement>('button')!;
  expect(add.disabled).toBe(true); expect(select.options[2]?.disabled).toBe(true);
  await act(async () => { select.value = '30'; select.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(add.disabled).toBe(false); await act(async () => add.click());
  expect(fixture.add).toHaveBeenCalledWith(expect.objectContaining({ variantId: '30', price: 230, maxQuantity: 1 }));
  fixture.lines = [{ ...fixture.add.mock.calls[0]![0], quantity: 1 }];
  await act(async () => root.render(createElement(HypeCard, { product }))); expect(add.disabled).toBe(true);
});
it('supports wishlist state and routes personalized purchases to product details', async () => {
  await act(async () => root.render(createElement(HypeCard, { product: { ...product, hasPersonalization: true } })));
  const heart = container.querySelector<HTMLButtonElement>('button[aria-label^="Wishlist"]')!;
  await act(async () => heart.click()); expect(fixture.toggle).toHaveBeenCalledWith('91');
  fixture.saved = true; await act(async () => root.render(createElement(HypeCard, { product: { ...product, hasPersonalization: true } }))); expect(heart.getAttribute('aria-pressed')).toBe('true');
  await act(async () => container.querySelector<HTMLButtonElement>('button[aria-label^="Choose options"]')!.click());
  const dialog = container.querySelector('[role=dialog]')!; expect(dialog.querySelector('button')).toBeNull(); expect(dialog.querySelector('a')?.getAttribute('href')).toBe('/products/amber'); expect(fixture.add).not.toHaveBeenCalled();
});
it('prevents a sold-out simple product from being added', async () => {
  await act(async () => root.render(createElement(HypeCard, { product: { ...product, variants: [], soldOut: true, availableStock: 0 } })));
  const add = container.querySelector<HTMLButtonElement>('button[aria-label^="Add to cart"]')!; expect(add.disabled).toBe(true); await act(async () => add.click()); expect(fixture.add).not.toHaveBeenCalled();
});

it('requires full option selection for an ambiguous color and never chooses unavailable stock', () => {
 const item: ProductCardModel = { ...product, variants: [
  { id: 'a', label: 'Black / Small', available: true, availableStock: 1, options: { Color: 'Black', Size: 'Small' } },
  { id: 'b', label: 'Black / Large', available: true, availableStock: 1, options: { Color: 'Black', Size: 'Large' } },
  { id: 'c', label: 'Green', available: false, availableStock: 0, options: { Color: 'Green' } },
  { id: 'd', label: 'Brown', available: true, availableStock: 2, options: { Color: 'Brown' } },
 ] };
 expect(walletVariantForColor(item, 'black')).toBeUndefined();
 expect(walletVariantForColor(item, 'Green')).toBeUndefined();
 expect(walletVariantForColor(item, 'Brown')).toBe('d');
});
