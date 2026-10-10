import type { ProductVariantModel } from '../types/catalog';

export const optionKey = (value: string): string => value.trim().toLowerCase();
// Current store policy wins over old recently-viewed card snapshots.
export const selectionAutomatic = (storePreference?: boolean, productPreference?: boolean): boolean => storePreference ?? productPreference ?? true;
export const normalizedOptions = (variant: ProductVariantModel): Record<string, string> => Object.fromEntries(
  Object.entries(variant.options ?? {}).map(([name, value]) => [optionKey(name), optionKey(value)]),
);
export const optionGroup = (variant: ProductVariantModel): string => JSON.stringify(Object.keys(normalizedOptions(variant)).sort());
export interface VariantSelection { group: string; values: Record<string, string>; id?: string }
export function selectionFor(variant: ProductVariantModel): VariantSelection {
  return { group: optionGroup(variant), values: normalizedOptions(variant), id: variant.id };
}
export const variantAvailable = (variant: ProductVariantModel): boolean => variant.available && (variant.availableStock === undefined || variant.availableStock > 0);
export function blankSelection(variants: ReadonlyArray<ProductVariantModel>): VariantSelection {
  return { group: variants[0] ? optionGroup(variants[0]) : '[]', values: {} };
}
/** A missing customer choice may use the default; an invalid explicit choice never does. */
export function resolveCardVariant(variants: ReadonlyArray<ProductVariantModel>, id?: string, automatic = true): ProductVariantModel | undefined {
  return id === undefined ? (automatic ? variants.find(variantAvailable) : undefined) : variants.find((variant) => variant.id === id);
}
export function resolveVariant(variants: ReadonlyArray<ProductVariantModel>, selection?: VariantSelection, automatic = true): ProductVariantModel | undefined {
  if (!selection) return resolveCardVariant(variants, undefined, automatic);
  const candidates = variants.filter((v) => optionGroup(v) === selection.group);
  if (selection.group === '[]') return candidates.find((v) => v.id === selection.id);
  // An impossible combination must stay unselected, never silently buy the parent or another SKU.
  return candidates.find((v) => {
    const options = normalizedOptions(v);
    return Object.keys(options).length === Object.keys(selection.values).length
      && Object.entries(options).every(([name, value]) => selection.values[name] === value);
  });
}
