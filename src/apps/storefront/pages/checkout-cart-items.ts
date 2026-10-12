import type { CartLine } from '../types/cart';
import type { CheckoutItem } from '../api/storefront';

/** Quotes and final placement must submit the same offer/variant/customization identity. */
export function checkoutCartItems(lines: ReadonlyArray<CartLine>): ReadonlyArray<CheckoutItem> {
  return lines.map((line) => ({ product_id: Number(line.productId), quantity: line.quantity,
    ...(line.variantId ? { variant_id: Number(line.variantId) } : {}),
    ...(line.personalization ? { personalization: line.personalization } : {}),
    ...(line.quantityOffer ? { quantity_offer_id: line.quantityOffer.id, quantity_offer_version: line.quantityOffer.version } : {}),
  }));
}
