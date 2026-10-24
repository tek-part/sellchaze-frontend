/**
 * Maison card meta line — "material · dimensions", built only from facts the product carries:
 * `material` (when present) and a dimension found in the title (`200×300`, `200 x 90 cm`, `45cm`,
 * `200 سم`). Returns an empty string when there is nothing true to say.
 */
import type { ProductCardModel } from '../../../types/catalog';

const DIMENSION = /(\d+(?:[.,]\d+)?\s*[×xX]\s*\d+(?:[.,]\d+)?(?:\s*[×xX]\s*\d+(?:[.,]\d+)?)?(?:\s*(?:cm|mm|m|سم|مم))?|\d+(?:[.,]\d+)?\s*(?:cm|mm|سم|مم))/u;

export function dimensionFromTitle(title: string): string {
  const m = title.match(DIMENSION);
  if (!m) return '';
  return m[1]!.replace(/\s*[xX]\s*/g, '×').replace(/\s*×\s*/g, '×').trim();
}

export function cardMetaLine(product: Pick<ProductCardModel, 'title' | 'material'>): string {
  const parts: string[] = [];
  const material = typeof product.material === 'string' ? product.material.trim() : '';
  if (material) parts.push(material);
  const dim = dimensionFromTitle(product.title);
  if (dim) parts.push(dim);
  return parts.join(' · ');
}
