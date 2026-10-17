import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PaymentMark, StorePaymentMarks } from './PaymentMarks';

const state = vi.hoisted(() => ({ marks: [] as Array<{ name: string; logo_url?: string | null }> }));
vi.mock('../state/store-context', () => ({ useStore: () => ({ store: { paymentMarks: state.marks } }) }));

describe('configured payment marks', () => {
  it('preserves the configured asset origin and accessible provider name in theme footers', () => {
    state.marks = [{ name: 'Card payment', logo_url: 'https://assets.example.test/payments/stripe.png' }];
    const html = renderToStaticMarkup(createElement(PaymentMark, { index: 0, fallback: 'Stripe' }));
    expect(html).toContain('src="https://assets.example.test/payments/stripe.png"');
    expect(html).toContain('alt="Card payment"');
    expect(renderToStaticMarkup(createElement(StorePaymentMarks, { label: 'Accepted payments' }))).toContain('aria-label="Accepted payments"');
  });
  it('retains text when a rolling-deployment API has no mark and hides an empty modern footer row', () => {
    state.marks = [];
    expect(renderToStaticMarkup(createElement(PaymentMark, { index: 0, fallback: 'Cash on delivery' }))).toBe('Cash on delivery');
    expect(renderToStaticMarkup(createElement(StorePaymentMarks))).toBe('');
  });
});
