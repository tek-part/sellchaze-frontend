import { describe, expect, it } from 'vitest';
import { addCartLine, changeCartQuantity } from './cart-quantity';

const item = { id: '1:2', productId: '1', variantId: '2', title: 'Bag', url: '/bag', price: 20, currency: 'EGP', maxQuantity: 3 };
describe('cart stock limits', () => {
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
