import type { ProductCardModel } from '../types/catalog';
import type { AddCartInput } from '../state/cart';

/** A card cannot add a parent SKU while the product requires a purchasable option. */
export function cardCartInput(product: ProductCardModel, variantId?: string): AddCartInput | null {
  if (product.soldOut || product.hasPersonalization) return null;
  const variant = product.variants?.find((item) => item.id === variantId);
  if (product.variants?.length && !variant?.available) return null;
  const stock = variant ? variant.availableStock : product.availableStock;
  if (stock !== undefined && stock <= 0) return null;
  return {
    id: `${product.id}:${variant?.id ?? 'default'}`, productId: product.id,
    digitalType: product.digitalType ?? 'physical',
    title: product.title, url: product.url, price: variant?.price ?? product.price,
    currency: product.currency, quantity: 1,
    ...(variant ? { variantId: variant.id, attributes: variant.label } : {}),
    ...(variant?.image || product.image ? { image: (variant?.image ?? product.image)!.src } : {}),
    ...(stock !== undefined ? { maxQuantity: stock } : {}),
  };
}
