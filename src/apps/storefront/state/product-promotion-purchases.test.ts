// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProductPromotions } from '../foundation/components/ProductPromotions';
import { recordPromotionPurchase } from './product-promotion-purchases';

let host: HTMLDivElement; let root: Root;
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); sessionStorage.clear(); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
const render = async (store: string) => { await act(async () => root.render(h(ProductPromotions, { id: '4', storeId: store, preferences: { is_fake_stock: true, fake_stock_count: 5 }, ar: false }))); };
it('changes the display only for accepted purchases, once per recent order, without changing cart or stock data', async () => {
  await render('501'); expect(host.textContent).toBe('5 pieces left');
  await act(async () => recordPromotionPurchase('501', 'Accepted-1', [{ product_id: 4, quantity: 2 }])); expect(host.textContent).toBe('3 pieces left');
  await act(async () => recordPromotionPurchase('501', 'Accepted-1', [{ product_id: 4, quantity: 2 }])); expect(host.textContent).toBe('3 pieces left');
  await act(async () => recordPromotionPurchase('502', 'Accepted-1', [{ product_id: 4, quantity: 2 }])); expect(host.textContent).toBe('3 pieces left');
  await act(async () => recordPromotionPurchase('501', 'Accepted-2', [{ product_id: 4, variant_id: 1, quantity: 1 }, { product_id: 4, variant_id: 2, quantity: 1 }])); expect(host.textContent).toBe('1 pieces left');
});
it('restores this tab’s accepted order history and suppresses a payment-recovery replay', async () => {
  sessionStorage.setItem('sf:promotion-purchases:v1:503', JSON.stringify({ orders: ['Restored-order'], quantities: { 4: 2 } }));
  await render('503'); expect(host.textContent).toBe('3 pieces left');
  await act(async () => recordPromotionPurchase('503', 'Restored-order', [{ product_id: 4, quantity: 2 }])); expect(host.textContent).toBe('3 pieces left');
});
it('rejects invalid quantities without marking their order as counted and never displays a negative count', async () => {
  await render('504'); await act(async () => recordPromotionPurchase('504', 'Accepted-3', [{ product_id: 4, quantity: -1 }])); expect(host.textContent).toBe('5 pieces left');
  await act(async () => recordPromotionPurchase('504', 'Accepted-3', [{ product_id: 4, quantity: 8 }])); expect(host.textContent).toBe('0 pieces left');
});
it('remains optional when tab storage is disabled', async () => {
  vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('Disabled'); }, setItem: () => { throw new Error('Disabled'); } });
  await render('505'); await act(async () => recordPromotionPurchase('505', 'Accepted-4', [{ product_id: 4, quantity: 1 }])); expect(host.textContent).toBe('4 pieces left');
});
