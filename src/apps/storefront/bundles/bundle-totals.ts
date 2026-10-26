/** Display-only bundle math; checkout recalculates the discount on the server. */
export interface BundleProduct { id: number; name: string; slug: string; price: string; compare_price: string | null; image_url: string | null; available: boolean }
export interface ProductBundle { id: string; title: string; discount_percent: number; products: ReadonlyArray<BundleProduct> }

export function bundleTotals(bundle: Pick<ProductBundle, 'discount_percent' | 'products'>, multiplier = 1): { original: number; discounted: number; saving: number } {
  const cents = bundle.products.reduce((sum, product) => sum + Math.round(Number(product.price) * multiplier * 100), 0);
  const saving = Math.round(cents * bundle.discount_percent / 100);
  return { original: cents / 100, discounted: (cents - saving) / 100, saving: saving / 100 };
}

export function bundleAvailable(bundle: Pick<ProductBundle, 'products'>): boolean {
  return bundle.products.length >= 2 && bundle.products.every((product) => product.available);
}
