import type { ProductVariantModel } from '../types/catalog';

export const optionKey = (value: string): string => value.trim().toLowerCase();
export const normalizedOptions = (variant: ProductVariantModel): Record<string, string> => Object.fromEntries(
  Object.entries(variant.options ?? {}).map(([name, value]) => [optionKey(name), optionKey(value)]),
);
export const optionGroup = (variant: ProductVariantModel): string => JSON.stringify(Object.keys(normalizedOptions(variant)).sort());
export interface VariantSelection { group: string; values: Record<string, string>; id?: string }
export function selectionFor(variant: ProductVariantModel): VariantSelection {
  return { group: optionGroup(variant), values: normalizedOptions(variant), id: variant.id };
}
export function resolveVariant(variants: ReadonlyArray<ProductVariantModel>, selection?: VariantSelection): ProductVariantModel | undefined {
  if (!selection) return variants.find((v) => v.available) ?? variants[0];
  const candidates = variants.filter((v) => optionGroup(v) === selection.group);
  if (selection.group === '[]') return candidates.find((v) => v.id === selection.id);
  // An impossible combination must stay unselected, never silently buy the parent or another SKU.
  return candidates.find((v) => {
    const options = normalizedOptions(v);
    return Object.keys(options).length === Object.keys(selection.values).length
      && Object.entries(options).every(([name, value]) => selection.values[name] === value);
  });
}
