/**
 * Stride card model — pure helpers that turn a `ProductCardModel` into what the card shows:
 * colour dots (from the product's colour swatches, else from variant colour options), the "new"
 * flag and the low-stock count. No React here so the rules are unit-tested directly.
 */
import type { ProductCardModel, ProductSwatch } from '../../../types/catalog';

/** Colour option keys merchants use for the colour axis of a variant. */
const COLOUR_KEY = /^(colou?r|اللون|لون)$/i;

/** A few plain colour words → a CSS colour, for variant options that carry a name but no swatch. */
const NAMED: Readonly<Record<string, string>> = {
  black: '#111111', 'أسود': '#111111',
  white: '#FFFFFF', 'أبيض': '#FFFFFF',
  grey: '#8A8A8A', gray: '#8A8A8A', 'رمادي': '#8A8A8A',
  red: '#D0101A', 'أحمر': '#D0101A',
  blue: '#1D4ED8', 'أزرق': '#1D4ED8',
  navy: '#1F2A44', 'كحلي': '#1F2A44',
  green: '#15803D', 'أخضر': '#15803D',
  volt: '#D4FF1E', lime: '#A3E635',
  yellow: '#FACC15', 'أصفر': '#FACC15',
  orange: '#F97316', 'برتقالي': '#F97316',
  pink: '#EC4899', 'وردي': '#EC4899',
  purple: '#7C3AED', 'بنفسجي': '#7C3AED',
  beige: '#D9C7A7', 'بيج': '#D9C7A7',
  brown: '#7A4E2D', 'بني': '#7A4E2D',
  silver: '#C9CDD2', 'فضي': '#C9CDD2',
};

export interface CardSwatch {
  readonly label: string;
  readonly color: string;
  readonly available: boolean;
}

/** Colour dots for a product, de-duplicated by label, in catalogue order. */
export function cardSwatches(product: ProductCardModel): ReadonlyArray<CardSwatch> {
  const out: CardSwatch[] = [];
  const seen = new Set<string>();
  const push = (label: string, color: string, available: boolean): void => {
    const key = label.trim().toLowerCase();
    if (!key || seen.has(key) || !color) return;
    seen.add(key);
    out.push({ label: label.trim(), color, available });
  };
  for (const s of product.colors ?? ([] as ReadonlyArray<ProductSwatch>)) push(s.label || s.value, s.color, s.available !== false);
  if (out.length > 0) return out;
  for (const v of product.variants ?? []) {
    for (const [key, value] of Object.entries(v.options ?? {})) {
      if (!COLOUR_KEY.test(key.trim())) continue;
      const color = NAMED[value.trim().toLowerCase()];
      if (color) push(value, color, v.available);
    }
  }
  return out;
}

/** True when the merchandising label (or a tag) marks the product as new. */
export function isNewProduct(product: ProductCardModel): boolean {
  const badge = (product.badge ?? '').trim().toLowerCase();
  if (/^(new|just in|جديد|وصل حديث)/.test(badge)) return true;
  return (product.tags ?? []).some((t) => /^(new|جديد)$/i.test(t.trim()));
}

/**
 * Units left: the product's own `availableStock`, else the sum over variants when every variant
 * reports a count. `undefined` when the store does not expose stock.
 */
export function stockLeft(product: ProductCardModel): number | undefined {
  if (typeof product.availableStock === 'number' && Number.isFinite(product.availableStock)) return Math.max(0, product.availableStock);
  const variants = product.variants ?? [];
  if (variants.length === 0 || variants.some((v) => typeof v.availableStock !== 'number')) return undefined;
  return variants.reduce((sum, v) => sum + (v.available ? Math.max(0, v.availableStock ?? 0) : 0), 0);
}

/** The low-stock count to show, or `null` (not low, sold out, or stock unknown). */
export function lowStockCount(product: ProductCardModel, threshold: number): number | null {
  if (product.soldOut) return null;
  const left = stockLeft(product);
  if (left === undefined || left <= 0) return null;
  return left <= Math.max(1, threshold) ? left : null;
}
