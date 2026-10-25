import { describe, expect, it } from 'vitest';
import {
  discountFieldErrors, discountFormFromApi, discountName, discountPayload, emptyDiscountForm, generateDiscountCode, summarizeDiscount, summarizeForm,
} from './discounts';

const money = (value: number): string => `EGP ${value.toFixed(2)}`;
const en = { ar: false, money, names: { categories: { 7: 'Tops' }, products: { 3: 'Tee' } } };
const ar = { ...en, ar: true };

describe('discount summaries', () => {
  it('describes amount discounts with their scope and minimums', () => {
    expect(summarizeDiscount({ type: 'percentage', value: '10.00', applies_to: 'categories', target_ids: [7], minimum_quantity: 3 }, en)).toBe('10% off Tops · min 3 items');
    expect(summarizeDiscount({ type: 'fixed', value: '25', applies_to: 'all', minimum_order_amount: '200' }, en)).toBe('EGP 25.00 off entire order · min order EGP 200.00');
    expect(summarizeDiscount({ type: 'percentage', value: 15, applies_to: 'products', target_ids: [3, 4, 5] }, en)).toBe('15% off 3 products');
    expect(summarizeDiscount({ type: 'percentage', value: '10', applies_to: 'categories', target_ids: [7], minimum_quantity: 3 }, ar)).toBe('خصم 10% على Tops · حد أدنى 3 قطع');
  });

  it('describes free shipping and buy X get Y', () => {
    expect(summarizeDiscount({ type: 'free_shipping', minimum_order_amount: '50' }, en)).toBe('Free shipping over EGP 50.00');
    expect(summarizeDiscount({ type: 'free_shipping' }, ar)).toBe('شحن مجاني');
    const bxgy = { buy_quantity: 2, buy_applies_to: 'all' as const, get_quantity: 1, get_applies_to: 'all' as const, get_percent: 100 };
    expect(summarizeDiscount({ type: 'buy_x_get_y', bxgy }, en)).toBe('Buy 2 get 1 free');
    expect(summarizeDiscount({ type: 'buy_x_get_y', bxgy: { ...bxgy, get_applies_to: 'categories', get_ids: [7], get_percent: 50, max_uses_per_order: 2 } }, en)).toBe('Buy 2 get 1 from Tops at 50% off · up to 2 per order');
    expect(summarizeDiscount({ type: 'buy_x_get_y', bxgy }, ar)).toBe('اشترِ 2 واحصل على 1 مجانًا');
  });

  it('names a discount by title, else by code', () => {
    expect(discountName({ title: 'Autumn sale', code: null })).toBe('Autumn sale');
    expect(discountName({ title: '', code: 'SAVE10' })).toBe('SAVE10');
  });
});

describe('discount payload', () => {
  it('sends an automatic category percentage without a code or bxgy', () => {
    const form = { ...emptyDiscountForm(), method: 'automatic' as const, title: ' Autumn sale ', value: '10', applies_to: 'categories' as const, target_ids: [7], requirement: 'quantity' as const, minimum_quantity: '3', code: 'IGNORED' };
    expect(discountPayload(form)).toEqual({
      method: 'automatic', code: null, title: 'Autumn sale', type: 'percentage', value: '10', applies_to: 'categories', target_ids: [7],
      minimum_order_amount: null, minimum_quantity: 3, bxgy: null, starts_at: null, expires_at: null, max_uses: null, max_uses_per_customer: null, is_active: true,
    });
    expect(summarizeForm(form, en)).toBe('10% off Tops · min 3 items');
  });

  it('sends a buy X get Y code with both sides and clears value, scope and minimums', () => {
    const form = { ...emptyDiscountForm(), code: 'bogo', type: 'buy_x_get_y' as const, value: '9', applies_to: 'products' as const, target_ids: [1], requirement: 'amount' as const, minimum_order_amount: '10',
      buy_quantity: '2', buy_applies_to: 'products' as const, buy_ids: [3], get_quantity: '1', get_applies_to: 'all' as const, get_ids: [9], get_free: true, max_uses_per_order: '1' };
    const payload = discountPayload(form);
    expect(payload).toMatchObject({ method: 'code', code: 'BOGO', type: 'buy_x_get_y', value: null, applies_to: 'all', target_ids: null, minimum_order_amount: null, minimum_quantity: null });
    expect(payload.bxgy).toEqual({ buy_quantity: 2, buy_applies_to: 'products', buy_ids: [3], get_quantity: 1, get_applies_to: 'all', get_ids: null, get_percent: 100, max_uses_per_order: 1 });
    expect(discountPayload({ ...form, get_free: false, get_percent: '40', max_uses_per_order: '' }).bxgy).toMatchObject({ get_percent: 40, max_uses_per_order: null });
  });

  it('round-trips an API discount into the form', () => {
    const form = discountFormFromApi({ id: 5, method: 'automatic', code: null, title: 'BOGO', type: 'buy_x_get_y', value: '0.00', applies_to: 'all', target_ids: [], minimum_quantity: null, minimum_order_amount: null,
      bxgy: { buy_quantity: 2, buy_applies_to: 'categories', buy_ids: [7], get_quantity: 1, get_applies_to: 'all', get_ids: [], get_percent: 50 }, starts_at: '2026-11-01T00:00:00.000000Z', is_active: true });
    expect(form).toMatchObject({ method: 'automatic', title: 'BOGO', value: '', buy_quantity: '2', buy_applies_to: 'categories', buy_ids: [7], get_free: false, get_percent: '50', starts_at: '2026-11-01', requirement: 'none' });
    expect(discountFormFromApi({ type: 'fixed', value: '5.00', minimum_order_amount: '100.00' })).toMatchObject({ method: 'code', value: '5.00', requirement: 'amount', minimum_order_amount: '100.00' });
  });
});

describe('discount helpers', () => {
  it('generates readable codes', () => {
    expect(generateDiscountCode(8, () => 0)).toBe('AAAAAAAA');
    expect(generateDiscountCode()).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
  });

  it('maps Laravel errors onto form fields, folding list entries', () => {
    expect(discountFieldErrors({ title: ['The title field is required.'], 'target_ids.0': ['Invalid target.'], 'bxgy.get_ids.1': ['Bad'], 'bxgy.get_ids.2': ['Ignored'] })).toEqual({
      title: 'The title field is required.', target_ids: 'Invalid target.', 'bxgy.get_ids': 'Bad',
    });
    expect(discountFieldErrors(null)).toEqual({});
  });
});
