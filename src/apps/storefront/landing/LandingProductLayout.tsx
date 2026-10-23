/**
 * Product page body for products that have a landing document. Loaded on demand by ProductPage so
 * ordinary product pages never download the landing builder (~127 KB).
 */
import type { ReactElement, ReactNode } from 'react';
import type { StorefrontContext } from '../theme-engine';
import type { LandingDocument } from './document';
import { LandingSections, ProductPresetSurface } from './LandingSections';
import { ProductDetailsSection } from '../foundation/sections/ProductDetailsSection';

export default function LandingProductLayout({ landing, context, template }: { landing: LandingDocument; context: StorefrontContext; template: ReactNode }): ReactElement {
  const checkout = <ProductDetailsSection context={context} instance={{ type: 'product-details' }} settings={{ show_share: false, show_wishlist: false }} purchaseOnly />;
  const showTemplate = landing.mode !== 'standalone' || !landing.sections.some((section) => section.type === 'checkout');
  return (
    <ProductPresetSurface document={landing}>
      {landing.mode === 'standalone' ? <LandingSections document={landing} context={context} checkout={checkout} /> : null}
      {showTemplate ? template : null}
      {landing.mode === 'below' ? <LandingSections document={landing} context={context} checkout={checkout} /> : null}
    </ProductPresetSurface>
  );
}
