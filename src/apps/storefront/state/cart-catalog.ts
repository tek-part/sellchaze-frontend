import type { CartLine } from '../types/cart';
import type { ProductDetailModel } from '../types/catalog';
import { normalizedPersonalization, personalizedLineId, personalizationReady } from '../utils/personalization';
import { normalizeCartLines } from './cart-quantity';

/** Reconcile only IDs covered by this response; concurrent additions of other products survive. */
export function reconcileCartCatalog(lines: ReadonlyArray<CartLine>, requestedIds: ReadonlyArray<string>, products: ReadonlyArray<ProductDetailModel>): CartLine[] {
  const requested = new Set(requestedIds);
  const catalog = new Map(products.filter((product) => requested.has(product.id)).map((product) => [product.id, product]));
  const refreshed = lines.flatMap((line) => {
    if (!requested.has(line.productId)) return [line];
    const product = catalog.get(line.productId);
    if (!product || product.soldOut) return [];
    const variant = product.variants?.find((item) => item.id === line.variantId);
    if (line.variantId ? !variant?.available : !!product.variants?.length) return [];
    const fields = product.personalizationFields ?? [];
    const values = normalizedPersonalization(Object.fromEntries(Object.entries(line.personalization ?? {}).filter(([key]) => fields.some((field) => field.key === key))));
    if (!personalizationReady(fields, values)) return [];
    const entries = fields.flatMap((field) => {
      if (!values[field.key]) return [];
      const previous = line.personalizationEntries?.find((entry) => entry.key === field.key && entry.type === field.type);
      return [{ ...previous, key: field.key, type: field.type, label: field.label, ...(field.type === 'text' ? { value: values[field.key] } : {}) }];
    });
    const stock = variant ? variant.availableStock : product.availableStock;
    const image = variant?.image ?? product.image;
    return [{
      id: personalizedLineId(product.id, variant?.id, values), productId: product.id,
      title: product.title, url: product.url, price: variant?.price ?? product.price,
      currency: product.currency, quantity: line.quantity, digitalType: product.digitalType ?? 'physical',
      ...(variant ? { variantId: variant.id, attributes: variant.label } : {}),
      ...(image ? { image: image.src } : {}),
      ...(stock !== undefined ? { maxQuantity: stock } : {}),
      ...(product.sharedMaxQuantity !== undefined ? { sharedMaxQuantity: product.sharedMaxQuantity } : {}),
      ...(Object.keys(values).length ? { personalization: values, personalizationEntries: entries } : {}),
    }];
  });
  // Removed optional fields can make two previous selections identical. Preserve their units
  // before applying current aggregate limits, rather than treating a canonicalized ID as corrupt.
  const merged = new Map<string, CartLine>();
  for (const line of refreshed) {
    const existing = merged.get(line.id);
    merged.set(line.id, existing ? { ...existing, quantity: existing.quantity + line.quantity } : line);
  }
  return normalizeCartLines([...merged.values()]);
}

export function cartPurchaseSummary(lines: ReadonlyArray<CartLine>): string {
  return JSON.stringify(lines.map((line) => [line.id, line.quantity, line.price, line.currency]));
}
