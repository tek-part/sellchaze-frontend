import { describe, expect, it } from 'vitest';
import { resolveVariant, selectionFor } from './variant-selection';
import type { ProductVariantModel } from '../types/catalog';

const variants: ProductVariantModel[] = [
  { id: '1', label: 'Blue S', available: true, price: 0, availableStock: 2, options: { Color: ' Blue ', Size: 'S' } },
  { id: '2', label: 'Red S', available: false, availableStock: 0, options: { color: 'Red', size: 'S' } },
  { id: '3', label: 'Red M', available: true, availableStock: 5, options: { size: 'M', color: 'Red' } },
  { id: '4', label: 'Legacy', available: true },
];
describe('variant property selection', () => {
  it('starts at an available SKU and preserves its zero price', () => {
    expect(resolveVariant(variants)?.id).toBe('1');
    expect(resolveVariant(variants)?.price).toBe(0);
  });
  it('normalizes property case, whitespace and key order', () => {
    expect(resolveVariant(variants, { group: selectionFor(variants[0]!).group, values: { color: 'red', size: 'm' } })?.id).toBe('3');
  });
  it('never falls back from impossible, partial or sold-out choices', () => {
    const choice = selectionFor(variants[0]!);
    expect(resolveVariant(variants, { ...choice, values: { color: 'blue', size: 'm' } })).toBeUndefined();
    expect(resolveVariant(variants, { ...choice, values: { color: 'blue' } })).toBeUndefined();
    expect(resolveVariant(variants, selectionFor(variants[1]!))?.available).toBe(false);
  });
  it('keeps legacy choices addressable without crossing property groups', () => {
    expect(resolveVariant(variants, selectionFor(variants[3]!))?.id).toBe('4');
    expect(resolveVariant(variants, { group: '[]', values: {}, id: '1' })).toBeUndefined();
    expect(resolveVariant([])).toBeUndefined();
  });
});
