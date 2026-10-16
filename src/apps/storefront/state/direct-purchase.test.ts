import { describe, expect, it, vi } from 'vitest';
import { readDirectPurchase, saveDirectPurchase } from './direct-purchase';

describe('isolated direct purchases', () => {
  it('preserves the exact selection with a thirty minute expiry and store/product isolation', () => {
    const data = new Map<string, string>(); const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); } };
    const item = { product_id: 4, variant_id: 9, quantity: 2, quantity_offer_id: 'fa8f41e8-4944-4847-86f5-8a27cf65ee33', quantity_offer_version: 3, personalization: { note: 'For you' } };
    expect(saveDirectPurchase('6', item, storage, 1000)).toBe(true);
    expect(readDirectPurchase('6', 4, storage, 2000)).toEqual(item);
    expect(readDirectPurchase('7', 4, storage, 2000)).toBeUndefined();
    expect(readDirectPurchase('6', 5, storage, 2000)).toBeUndefined();
    expect(readDirectPurchase('6', 4, storage, 1_801_001)).toBeUndefined();
  });
  it('rejects a malformed persisted value instead of resurrecting an older selection', () => {
    saveDirectPurchase('8', { product_id: 4, quantity: 1 }, undefined, 1000);
    expect(readDirectPurchase('8', 4, { getItem: () => '{bad' }, 2000)).toBeUndefined();
    expect(readDirectPurchase('8', 4, undefined, 2000)).toBeUndefined();
  });
  it('works in memory when the session storage getter throws and retains its own snapshot', () => {
    vi.stubGlobal('window', { get sessionStorage() { throw new Error('Storage disabled'); } });
    try {
      const item = { product_id: 2, quantity: 1 };
      expect(saveDirectPurchase('9', item)).toBe(true); item.quantity = 6;
      expect(readDirectPurchase('9', 2)).toEqual({ product_id: 2, quantity: 1 });
    } finally { vi.unstubAllGlobals(); }
  });
  it('rejects invalid quantities, foreign shapes and an offer missing its version', () => {
    expect(saveDirectPurchase('1', { product_id: 1, quantity: 0 })).toBe(false);
    expect(saveDirectPurchase('1', { product_id: 1, quantity: 1.5 })).toBe(false);
    expect(saveDirectPurchase('1', { product_id: 1, quantity: 1, quantity_offer_id: 'fa8f41e8-4944-4847-86f5-8a27cf65ee33' })).toBe(false);
  });
});
