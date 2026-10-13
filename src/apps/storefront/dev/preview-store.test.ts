import { describe, expect, it } from 'vitest';
import { previewStore } from './preview-store';
import type { StoreInfo } from '../state/store-context';
describe('preview storefront data', () => {
  const base: StoreInfo = { id: 'dev', name: 'Demo', slug: 'demo', defaultLocale: 'en', supportedLocales: ['en', 'ar'], currency: 'USD', baseCurrency: 'USD', supportedCurrencies: ['USD'], currencyMultipliers: { USD: 1 } };
  it('aligns kids preview cart currency with its sample prices and supplies preview policy content', () => {
    const store = previewStore(base, 'nature-kids');
    expect(store.currency).toBe('EGP'); expect(store.baseCurrency).toBe('EGP'); expect(store.merchantInformation?.policies.map(policy => policy.kind)).toEqual(['shipping', 'returns', 'cod']);
    expect(base.currency).toBe('USD'); expect(base.merchantInformation).toBeUndefined();
  });
  it('keeps the existing general-store preview unchanged', () => { expect(previewStore(base, 'naseem')).toBe(base); });
});
