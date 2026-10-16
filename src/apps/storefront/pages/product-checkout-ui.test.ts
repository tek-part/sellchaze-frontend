// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductInlineCheckout from './ProductInlineCheckout';
import type { CheckoutItem } from '../api/storefront';

const fixture = vi.hoisted(() => ({ quote: vi.fn(), flow: vi.fn(), submit: vi.fn(), minimum: true }));
vi.mock('../api/storefront', () => ({ quoteCheckout: (...args: unknown[]) => fixture.quote(...args) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../analytics/checkout-hooks', () => ({ useCheckoutMetrics: () => undefined }));
vi.mock('./useCheckoutLead', () => ({ useCheckoutLead: () => ({ submitToken: () => 'local-lead' }) }));
vi.mock('./CheckoutMinimum', () => ({ CheckoutMinimum: () => null }));
vi.mock('./minimum-order', () => ({ minimumOrderAllows: () => fixture.minimum }));
vi.mock('./CheckoutRecovery', () => ({ CheckoutRecovery: () => null }));
vi.mock('./CheckoutFields', () => ({ CheckoutFieldsForm: () => null, useCheckoutFields: () => ({ ready: true, shippingReady: true, shippingSelection: {}, phoneVerification: { ready: true }, botProtection: { ready: true }, payload: () => ({ customer_name: 'Local buyer' }) }) }));
vi.mock('./useCheckoutPaymentFlow', () => ({ useCheckoutPaymentFlow: (options: unknown) => { fixture.flow(options); return { paymentMethod: 'cod', paymentMethods: [{ slug: 'cod', name: 'COD' }], submit: fixture.submit }; } }));

let host: HTMLDivElement; let root: Root;
beforeEach(() => { vi.clearAllMocks(); fixture.minimum = true; Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); fixture.quote.mockResolvedValue({ data: { currency: 'EGP', requires_shipping: false, items: [{ product_id: 4, variant_id: 5, name: 'Selection L', quantity: 2, line_total: '80' }], totals: { subtotal: '80', discount_total: '0', shipping_total: '0', tax_total: '0', grand_total: '80' } } }); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const render = async (items: ReadonlyArray<CheckoutItem>, ready = true) => { await act(async () => root.render(h(ProductInlineCheckout, { productId: '4', items, ready }))); };
const submit = async () => { await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); };

describe('same-page checkout', () => {
  it('quotes the live variant, quantity, offer and personalization without using or clearing the ordinary basket', async () => {
    const item = { product_id: 4, variant_id: 5, quantity: 2, personalization: { note: 'Review' }, quantity_offer_id: 'fa8f41e8-4944-4847-86f5-8a27cf65ee33', quantity_offer_version: 2 };
    await render([item]); expect(fixture.quote).toHaveBeenLastCalledWith([item], '', {}); expect(host.textContent).toContain('Selection L × 2');
    expect(fixture.flow).toHaveBeenLastCalledWith({ items: [item], preserveCart: true, surface: 'product' });
    await render([{ ...item, variant_id: 6, quantity: 4 }]);
    expect(fixture.quote).toHaveBeenLastCalledWith([{ ...item, variant_id: 6, quantity: 4 }], '', {});
    await submit(); expect(fixture.submit).toHaveBeenCalledExactlyOnceWith({ customer_name: 'Local buyer', coupon_code: '', lead_token: 'local-lead' });
  });
  it('does not quote or submit an unavailable or incomplete selection', async () => {
    await render([{ product_id: 4, quantity: 1 }], false); await submit();
    expect(fixture.quote).not.toHaveBeenCalled(); expect(fixture.submit).not.toHaveBeenCalled();
  });
  it('keeps minimum order validation in the direct flow', async () => {
    fixture.minimum = false; await render([{ product_id: 4, quantity: 1 }]); await submit(); expect(fixture.submit).not.toHaveBeenCalled();
  });
  it('retries a failed quote before enabling a purchase', async () => {
    fixture.quote.mockRejectedValueOnce(new Error('Delivery changed'));
    await render([{ product_id: 4, quantity: 1 }]); await submit(); expect(fixture.submit).not.toHaveBeenCalled();
    const retry = [...host.querySelectorAll('button')].find((button) => button.textContent === 'Try again')!;
    expect(retry).toBeTruthy(); await act(async () => retry.click()); await submit(); expect(fixture.submit).toHaveBeenCalledTimes(1);
  });
});
