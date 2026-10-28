// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { StorefrontPaymentMethod } from '../api/storefront';
import { PaymentAmountLimitHint } from './PaymentAmountLimitHint';

const method: StorefrontPaymentMethod = { slug: 'deema', name: 'Deema', test_mode: true, amount_limits: { currency: 'KWD', minimum: '100.000', maximum: '200.000' } };
const render = (option = method, locale = 'en') => renderToStaticMarkup(<PaymentAmountLimitHint method={option} locale={locale} />);

describe('public payment amount limits', () => {
  it('shows the exact inherited sandbox range as the amount this method collects', () => {
    const html = render();
    expect(html).toContain('Amount collected by this method: at least');
    expect(html).toContain('<bdi>100.000 KWD</bdi>'); expect(html).toContain('<bdi>200.000 KWD</bdi>');
  });
  it('keeps Arabic direction and exact KWD limits readable', () => {
    const html = render(method, 'ar');
    expect(html).toContain('المبلغ المدفوع بهذه الطريقة: من'); expect(html).toContain(' إلى ');
    expect(html.match(/<bdi>/g)).toHaveLength(2);
  });
  it('does not invent a maximum for live Deema', () => {
    const html = render({ ...method, test_mode: false, amount_limits: { currency: 'KWD', minimum: '10.000', maximum: null } });
    expect(html).toContain('10.000 KWD'); expect(html).not.toContain('up to'); expect(html).not.toContain('200.000');
  });
  it('leaves providers without amount limits unchanged', () => {
    expect(render({ slug: 'tap', name: 'Tap', test_mode: true })).toBe('');
  });
  it.each([
    { currency: 'KWD', minimum: '<script>', maximum: '200.000' },
    { currency: 'KWD', minimum: '100.000', maximum: '99.000' },
    { currency: 'javascript:', minimum: '100.000', maximum: null },
  ])('does not display malformed server limits %o', amount_limits => {
    expect(render({ ...method, amount_limits })).toBe('');
  });
});
