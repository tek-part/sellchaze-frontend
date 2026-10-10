import type { PersonalizationField, PersonalizationValues } from '../types/personalization';

export function normalizedPersonalization(values: PersonalizationValues): PersonalizationValues {
  return Object.fromEntries(Object.keys(values).sort().flatMap((key) => {
    const value = values[key]!.trim();
    return value ? [[key, value]] : [];
  }));
}
/** Exact canonical identity keeps distinct text/images on separate cart lines without hash collisions. */
export function personalizedLineId(productId: string, variantId: string | undefined, values: PersonalizationValues): string {
  const base = `${productId}:${variantId ?? 'default'}`;
  const normalized = normalizedPersonalization(values);
  return Object.keys(normalized).length ? `${base}:${JSON.stringify(normalized)}` : base;
}
export function personalizationReady(fields: ReadonlyArray<PersonalizationField>, values: PersonalizationValues): boolean {
  return fields.every((field) => {
    const value = values[field.key]?.trim() ?? '';
    return (!field.required || value.length > 0) && (field.type !== 'text' || Array.from(value).length <= field.max_length);
  });
}
