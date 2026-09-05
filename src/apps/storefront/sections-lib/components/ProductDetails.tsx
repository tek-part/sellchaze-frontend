/**
 * product-details — the PDP buy box. ADAPTED, not rewritten: wraps luxury-fashion's
 * `ProductDetailsSection` (gallery, variants, quantity, add-to-cart, wishlist/share, tabs, reviews),
 * which is token-driven and already wired to the cart/wishlist/toast stores. Its `.sf-pdp*` skin
 * lives in luxury's `pages.css`, which `main.tsx` already loads app-level for every theme, so no
 * extra stylesheet is needed here. A theme that wants a bespoke PDP overrides `product-details` in
 * `createSectionMap({ 'product-details': MyPdp })`.
 *
 * Requires the luxury `ToastProvider` somewhere above (the theme's DefaultLayout).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { ProductDetailsSection } from '../../themes/luxury-fashion/sections/ProductDetailsSection';
import { defineSection, fields } from '../schema';
import { useSectionSettings } from '../use-section';

export const productDetailsSchema = defineSection({
  type: 'product-details',
  label: 'Product details',
  description: 'Gallery, price, options and add-to-cart of a product page.',
  category: 'products',
  icon: 'HiOutlineShoppingCart',
  settings: [
    fields.toggle('show_share', 'Show share button', true),
    fields.toggle('show_sku', 'Show SKU', false),
  ],
});

export function ProductDetails(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(productDetailsSchema, props.settings);
  return <ProductDetailsSection instance={props.instance} settings={s} context={props.context} />;
}
