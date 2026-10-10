import type { ProductDetailModel, ProductMediaModel, ProductVariantModel } from '../types/catalog';
import { optionKey } from '../state/variant-selection';

/** Explicit SKU image wins; a configured property image is the next choice. */
export function variantImage(product: ProductDetailModel, variant?: ProductVariantModel): string | undefined {
  if (!variant) return undefined;
  const safe = (url?: string | null) => url && /^(https?:\/\/|\/(?!\/))/i.test(url) ? url : undefined;
  const explicit = safe(variant.image?.src);
  if (explicit) return explicit;
  for (const axis of product.optionDisplay ?? []) {
    const value = Object.entries(variant.options ?? {}).find(([name]) => optionKey(name) === optionKey(axis.name))?.[1];
    const image = value ? safe(axis.values.find((entry) => optionKey(entry.value) === optionKey(value))?.image_url) : undefined;
    if (image) return image;
  }
  return undefined;
}

export function variantGallery(product: ProductDetailModel, image?: string): ReadonlyArray<ProductMediaModel> {
  const items = product.media?.length ? product.media : product.images.map((entry) => ({ ...entry, type: 'image' as const }));
  return image && !items.some((entry) => entry.type === 'image' && entry.src === image)
    ? [{ type: 'image', src: image, alt: product.title }, ...items] : items;
}
