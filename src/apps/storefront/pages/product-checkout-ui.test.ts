// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProductInlineCheckout from './ProductInlineCheckout';
import type { CheckoutItem } from '../api/storefront';

const fixture = vi.hoisted(() => ({ quote: vi.fn(), check: vi.fn(), flow: vi.fn(), submit: vi.fn(), minimum: true }));
vi.mock('../api/storefront', () => ({ quoteCheckout: (...args: unknown[]) => fixture.quote(...args), checkGiftCard: (...args: unknown[]) => fixture.check(...args) }));
vi.mock('../i18n/useLocale', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../analytics/checkout-hooks', () => ({ useCheckoutMetrics: () => undefined }));
vi.mock('./useCheckoutLead', () => ({ useCheckoutLead: () => ({ submitToken: () => 'local-lead' }) }));
vi.mock('./CheckoutMinimum', () => ({ CheckoutMinimum: () => null }));
vi.mock('./minimum-order', () => ({ minimumOrderAllows: () => fixture.minimum }));
vi.mock('./CheckoutRecovery', () => ({ CheckoutRecovery: () => null }));
vi.mock('./CheckoutFields', () => ({ CheckoutFieldsForm: () => null, useCheckoutFields: () => ({ ready: true, shippingReady: true, shippingSelection: {}, phoneVerification: { ready: true }, botProtection: { ready: true }, payload: () => ({ customer_name: 'Local buyer' }) }) }));
vi.mock('./useCheckoutPaymentFlow', () => ({ useCheckoutPaymentFlow: (options: unknown) => { fixture.flow(options); return { paymentMethod: 'cod', paymentMethods: [{ slug: 'cod', name: 'COD' }], submit: fixture.submit, correctedQuote: () => null, totalChanged: false }; } }));

let host: HTMLDivElement; let root: Root;
beforeEach(() => { vi.clearAllMocks(); fixture.minimum = true; Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); host = document.createElement('div'); document.body.append(host); root = createRoot(host); fixture.quote.mockResolvedValue({ data: { currency: 'EGP', requires_shipping: false, items: [{ product_id: 4, variant_id: 5, name: 'Selection L', quantity: 2, line_total: '80' }], totals: { subtotal: '80', discount_total: '0', shipping_total: '0', tax_total: '0', grand_total: '80' } } }); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const render = async (items: ReadonlyArray<CheckoutItem>, ready = true) => { await act(async () => root.render(h(ProductInlineCheckout, { productId: '4', items, ready }))); };
const submit = async () => { await act(async () => host.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); };

describe('same-page checkout', () => {
  it('shows the server payment discount and submits its reviewed quote token', async () => {
    fixture.quote.mockResolvedValue({ data: { currency: 'EGP', requires_shipping: false, payment_adjustment_token: 'b'.repeat(64), items: [{ product_id: 4, name: 'Selection', quantity: 1, line_total: '80' }], totals: { subtotal: '80', discount_total: '0', shipping_total: '0', tax_total: '0', payment_adjustment_total: '-8.00', grand_total: '72.00' } } });
    await render([{ product_id: 4, quantity: 1 }]);
    expect(host.textContent).toContain('Payment method discount');
    expect(host.querySelector('[data-payment-adjustment]')?.textContent).toContain('8.00');
    await submit();
    expect(fixture.submit).toHaveBeenCalledWith(expect.objectContaining({ payment_adjustment_token: 'b'.repeat(64), expected_total: expect.any(String) }), expect.any(String));
  });
  it('quotes the live variant, quantity, offer and personalization without using or clearing the ordinary basket', async () => {
    const item = { product_id: 4, variant_id: 5, quantity: 2, personalization: { note: 'Review' }, quantity_offer_id: 'fa8f41e8-4944-4847-86f5-8a27cf65ee33', quantity_offer_version: 2 };
    await render([item]); expect(fixture.quote).toHaveBeenLastCalledWith([item], '', {}, 'cod', [], {}); expect(host.textContent).toContain('Selection L × 2');
    expect(fixture.flow).toHaveBeenLastCalledWith({ items: [item], preserveCart: true, surface: 'product' });
    await render([{ ...item, variant_id: 6, quantity: 4 }]);
    expect(fixture.quote).toHaveBeenLastCalledWith([{ ...item, variant_id: 6, quantity: 4 }], '', {}, 'cod', [], {});
    await submit(); expect(fixture.submit).toHaveBeenCalledExactlyOnceWith({ customer_name: 'Local buyer', coupon_code: '', lead_token: 'local-lead', expected_total: expect.any(String) }, expect.any(String));
  });
  it('applies a gift card as a masked line and submits without a payment method when it covers the total', async () => {
    fixture.check.mockResolvedValue({ data: { last4: 'AAAA', balance: '100.00', currency: 'EGP', expires_at: null } });
    fixture.quote.mockImplementation(async (_items: unknown, _coupon: unknown, _selection: unknown, _method: unknown, cards: string[] = []) => ({ data: { currency: 'EGP', requires_shipping: false,
      items: [{ product_id: 4, name: 'Selection', quantity: 1, line_total: '80' }], gift_cards: cards.map(() => ({ last4: 'AAAA', applied: '80.00', balance_after: '20.00' })), amount_due: cards.length ? '0.00' : '80.00',
      totals: { subtotal: '80', discount_total: '0', shipping_total: '0', tax_total: '0', grand_total: '80.00', gift_card_total: cards.length ? '80.00' : '0.00' } } }));
    await render([{ product_id: 4, quantity: 1 }]);
    expect(host.querySelector('[data-paid-by-gift-cards]')).toBeNull();
    const input = host.querySelector<HTMLInputElement>('[data-gift-card-field] input')!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'gift-aaaa aaaa-aaaa'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    const apply = [...host.querySelectorAll<HTMLButtonElement>('[data-gift-card-field] button')].find((button) => button.textContent?.includes('Apply'))!;
    await act(async () => apply.click());
    await act(async () => { await Promise.resolve(); });
    expect(fixture.check).toHaveBeenCalledExactlyOnceWith('GIFTAAAAAAAAAAAA');
    expect(fixture.quote).toHaveBeenLastCalledWith([{ product_id: 4, quantity: 1 }], '', {}, 'cod', ['GIFTAAAAAAAAAAAA'], {});
    expect(host.querySelector('[data-gift-card-line]')?.textContent).toContain('•••• AAAA');
    expect(host.querySelector('[data-amount-due]')?.textContent).toContain('0.00');
    expect(host.querySelector('[data-paid-by-gift-cards]')).not.toBeNull();
    await submit();
    expect(fixture.submit).toHaveBeenCalledExactlyOnceWith({ customer_name: 'Local buyer', coupon_code: '', lead_token: 'local-lead', gift_cards: ['GIFTAAAAAAAAAAAA'], payment_method: undefined, expected_total: '80.00' }, expect.any(String));
  });
  it('lists each applied discount by title and shows a free-shipping discount as free shipping', async () => {
    fixture.quote.mockResolvedValue({ data: { currency: 'EGP', requires_shipping: true, items: [{ product_id: 4, name: 'Selection', quantity: 3, line_total: '300' }],
      discounts: [{ id: 1, title: 'Autumn sale', code: null, method: 'automatic', type: 'percentage', amount: '30.00' }, { id: 2, title: 'Ship free over 50', code: null, method: 'automatic', type: 'free_shipping', amount: '0.00' }],
      totals: { subtotal: '300', discount_total: '30.00', shipping_total: '0.00', tax_total: '0', grand_total: '270.00' } } });
    await render([{ product_id: 4, quantity: 3 }]);
    const rows = [...host.querySelectorAll('[data-discount-line]')].map((row) => row.textContent);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Autumn sale'); expect(rows[0]).toContain('−'); expect(rows[0]).toContain('30.00');
    expect(rows[1]).toBe('Ship free over 50Free shipping');
    expect(host.textContent).toContain('ShippingFree');
  });
  it('keeps the single discount line from an older API without discounts', async () => {
    fixture.quote.mockResolvedValue({ data: { currency: 'EGP', requires_shipping: false, items: [{ product_id: 4, name: 'Selection', quantity: 1, line_total: '80' }], totals: { subtotal: '80', discount_total: '8.00', shipping_total: '0', tax_total: '0', grand_total: '72.00' } } });
    await render([{ product_id: 4, quantity: 1 }]);
    const rows = [...host.querySelectorAll('[data-discount-line]')];
    expect(rows).toHaveLength(1); expect(rows[0]!.textContent).toContain('Discount'); expect(rows[0]!.textContent).toContain('8.00');
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
