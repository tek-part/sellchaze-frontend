import { describe, expect, it } from 'vitest';
import { addCartLine, changeCartQuantity, cartAdditionLimit, cartLineLimit, normalizeCartLines } from './cart-quantity';

const item = { id: '1:2', productId: '1', variantId: '2', title: 'Bag', url: '/bag', price: 20, currency: 'EGP', maxQuantity: 3 };
describe('cart stock limits', () => {
  it('combines a merchant limit across physical/link variants and personalization without limiting other products', () => {
    for (const digitalType of ['physical', 'link'] as const) {
      const capped = { ...item, digitalType, orderMaxQuantity: 3, maxQuantity: 8 };
      const lines = addCartLine(addCartLine([], { ...capped, quantity: 2 }), { ...capped, id: 'Bob', variantId: '3', quantity: 2 });
      expect(lines.map((line) => line.quantity)).toEqual([2, 1]);
      expect(cartAdditionLimit(lines, { ...capped, variantId: '4' })).toBe(0);
      expect(changeCartQuantity(lines, lines[1]!.id, 99)).toEqual(lines);
      expect(addCartLine(lines, { ...capped, productId: 'other', id: 'other', quantity: 3 })).toHaveLength(3);
    }
  });
  it('respects the smallest of order, code-pool and SKU limits and clears a disabled merchant limit on refresh', () => {
    const capped = { ...item, digitalType: 'codes' as const, sharedMaxQuantity: 5, orderMaxQuantity: 4 };
    const lines = addCartLine(addCartLine([], { ...capped, quantity: 3 }), { ...capped, id: 'B', variantId: '3', quantity: 3 });
    expect(lines.map((line) => line.quantity)).toEqual([3, 1]);
    const uncapped = addCartLine(lines, { ...capped, id: 'B', variantId: '3', orderMaxQuantity: undefined, quantity: 3 });
    expect(uncapped.map((line) => line.quantity)).toEqual([3, 2]);
    expect(uncapped.every((line) => line.orderMaxQuantity === undefined)).toBe(true);
    const saved = [{ ...item, orderMaxQuantity: 5, quantity: 3 }, { ...item, id: 'B', variantId: '3', orderMaxQuantity: 2, quantity: 1 }];
    expect(normalizeCartLines(saved).map((line) => line.quantity)).toEqual([2]);
  });
  it('shares code units across variants and personalizations while retaining each SKU limit', () => {
    const codes = { ...item, digitalType: 'codes' as const, sharedMaxQuantity: 3 };
    let lines = addCartLine([], { ...codes, maxQuantity: 1, quantity: 2 });
    lines = addCartLine(lines, { ...codes, id: '1:3:Bob', variantId: '3', quantity: 2 });
    expect(lines.map((line) => line.quantity)).toEqual([1, 2]);
    expect(cartAdditionLimit(lines, { ...codes, variantId: '4' })).toBe(0);
    expect(cartLineLimit(lines, lines[1]!)).toBe(2);
    expect(changeCartQuantity(lines, '1:3:Bob', 99)).toEqual(lines);
    lines = changeCartQuantity(lines, '1:3:Bob', 1);
    expect(cartAdditionLimit(lines, { ...codes, variantId: '4' })).toBe(1);
    const personalized = addCartLine(lines, { ...codes, id: '1:3:Alice', variantId: '3', quantity: 2 });
    expect(personalized.map((line) => line.quantity)).toEqual([1, 1, 1]);
  });
  it('refreshes a code pool across every variant, including an exhausted or replenished observation', () => {
    const codes = { ...item, digitalType: 'codes' as const, sharedMaxQuantity: 4 };
    const lines = addCartLine(addCartLine([], { ...codes, quantity: 2 }), { ...codes, id: '1:3', variantId: '3', quantity: 2 });
    const smaller = addCartLine(lines, { ...codes, sharedMaxQuantity: 1 });
    expect(smaller.map((line) => line.quantity)).toEqual([1]);
    expect(smaller[0]?.sharedMaxQuantity).toBe(1);
    expect(cartAdditionLimit(smaller, { ...codes, variantId: '3' })).toBe(3);
    const replenished = addCartLine(smaller, { ...codes, id: '1:3', variantId: '3', quantity: 3 });
    expect(replenished.map((line) => line.quantity)).toEqual([1, 3]);
    expect(replenished.every((line) => line.sharedMaxQuantity === 4)).toBe(true);
    expect(addCartLine(replenished, { ...codes, sharedMaxQuantity: 0 })).toEqual([]);
  });
  it('restores aggregate pool and SKU limits from persisted lines, without counting duplicate IDs', () => {
    const codes = { ...item, digitalType: 'codes' as const, sharedMaxQuantity: 3 };
    const saved = [{ ...codes, quantity: 2 }, { ...codes, id: '1:3', variantId: '3', quantity: 2 }, { ...codes, quantity: 2 }];
    expect(normalizeCartLines(saved).map((line) => line.quantity)).toEqual([2, 1]);
    expect(normalizeCartLines([{ ...item, quantity: 3 }, { ...item, id: 'Alice', maxQuantity: 1, quantity: 1 }]).map((line) => line.quantity)).toEqual([1]);
  });
  it('keeps different products and shared-link/physical variants independent', () => {
    const codes = { ...item, digitalType: 'codes' as const, sharedMaxQuantity: 1 };
    const lines = addCartLine([], codes);
    expect(addCartLine(lines, { ...codes, id: 'other', productId: 'other' })).toHaveLength(2);
    for (const digitalType of ['physical', 'link'] as const) {
      const independent = { ...item, digitalType };
      expect(addCartLine(addCartLine([], { ...independent, quantity: 3 }), { ...independent, id: '1:3', variantId: '3', quantity: 3 }).map((line) => line.quantity)).toEqual([3, 3]);
    }
  });
  it('shares a SKU cap across different personalized lines for add and quantity edits', () => {
    const first = { ...item, id: '1:2:Alice', quantity: 2 };
    const second = { ...item, id: '1:2:Bob', quantity: 2 };
    const lines = addCartLine(addCartLine([], first), second);
    expect(lines.map((line) => line.quantity)).toEqual([2, 1]);
    expect(addCartLine(lines, { ...item, id: '1:2:Carol' })).toEqual(lines);
    expect(changeCartQuantity(lines, second.id, 99).map((line) => line.quantity)).toEqual([2, 1]);
    const reduced = addCartLine(lines, { ...first, maxQuantity: 1 });
    expect(reduced.map((line) => line.quantity)).toEqual([1]);
    expect(addCartLine(lines, { ...item, id: '1:3:Carol', variantId: '3' })).toHaveLength(3);
  });
  it('caps first add, repeat add and direct quantity edits', () => {
    const lines = addCartLine([], { ...item, quantity: 99 });
    expect(lines[0]?.quantity).toBe(3);
    expect(addCartLine(lines, item)[0]?.quantity).toBe(3);
    expect(changeCartQuantity(lines, item.id, 50)[0]?.quantity).toBe(3);
  });
  it('refreshes stock and price when an existing SKU is added again', () => {
    const lines = addCartLine([], { ...item, quantity: 3 });
    const refreshed = addCartLine(lines, { ...item, price: 0, maxQuantity: 1 });
    expect(refreshed[0]).toMatchObject({ quantity: 1, maxQuantity: 1, price: 0 });
    expect(changeCartQuantity(refreshed, item.id, 9)[0]?.quantity).toBe(1);
    expect(addCartLine(lines, { ...item, maxQuantity: 0 })).toEqual([]);
  });
  it('normalizes fractional quantities and rejects nonfinite or negative adds', () => {
    expect(addCartLine([], { ...item, quantity: 1.9 })[0]?.quantity).toBe(1);
    for (const quantity of [NaN, Infinity, -2, 0]) expect(addCartLine([], { ...item, quantity })).toEqual([]);
    expect(changeCartQuantity(addCartLine([], item), item.id, NaN)[0]?.quantity).toBe(1);
    expect(changeCartQuantity(addCartLine([], item), item.id, 0)).toEqual([]);
  });
  it('allows untracked inventory and keeps different variants independent', () => {
    const { maxQuantity: _cap, ...untracked } = item;
    const lines = addCartLine(addCartLine([], item), { ...untracked, quantity: 9 });
    expect(lines[0]?.quantity).toBe(10);
    expect(lines[0]?.maxQuantity).toBeUndefined();
    expect(addCartLine(lines, { ...item, id: '1:3', variantId: '3' })).toHaveLength(2);
  });
});
