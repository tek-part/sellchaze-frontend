import { describe, expect, it } from 'vitest';
import { blankSelection, resolveCardVariant, resolveVariant, selectionAutomatic, selectionFor } from './variant-selection';
import type { ProductVariantModel } from '../types/catalog';

const variants: ProductVariantModel[] = [
  { id: '1', label: 'Blue S', available: true, price: 0, availableStock: 2, options: { Color: ' Blue ', Size: 'S' } },
  { id: '2', label: 'Red S', available: false, availableStock: 0, options: { color: 'Red', size: 'S' } },
  { id: '3', label: 'Red M', available: true, availableStock: 5, options: { size: 'M', color: 'Red' } },
  { id: '4', label: 'Legacy', available: true },
];
describe('variant property selection', () => {
  it('uses current store policy over cached card data, with an independent preview fallback', () => {
    expect(selectionAutomatic(false, true)).toBe(false);
    expect(selectionAutomatic(true, false)).toBe(true);
    expect(selectionAutomatic(undefined, false)).toBe(false);
    expect(selectionAutomatic()).toBe(true);
  });
  it('leaves both property and card selections empty when automatic selection is disabled', () => {
    expect(resolveVariant(variants, undefined, false)).toBeUndefined();
    expect(resolveCardVariant(variants, undefined, false)).toBeUndefined();
    const blank = blankSelection(variants);
    expect(blank.values).toEqual({});
    expect(blank.id).toBeUndefined();
    expect(resolveVariant(variants, blank)).toBeUndefined();
    expect(resolveVariant(variants, selectionFor(variants[2]!), false)?.id).toBe('3');
    expect(resolveCardVariant(variants, '3', false)?.id).toBe('3');
  });
  it('never auto-selects sold out stock, or falls back from an explicit card choice', () => {
    const stockGone = { ...variants[0]!, availableStock: 0 };
    expect(resolveCardVariant([variants[1]!, stockGone])).toBeUndefined();
    expect(resolveVariant([variants[1]!, stockGone])).toBeUndefined();
    expect(resolveCardVariant(variants, 'missing')).toBeUndefined();
    expect(resolveCardVariant(variants, '')).toBeUndefined();
    expect(resolveCardVariant(variants, '2')?.id).toBe('2');
    expect(resolveCardVariant(variants, '2')?.available).toBe(false);
    expect(resolveCardVariant([stockGone, variants[2]!], '1')?.id).toBe('1');
    expect(resolveCardVariant([stockGone, variants[2]!])?.id).toBe('3');
  });
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
