/**
 * recently-viewed — re-engage; frictionless return. Reads the client-side recently-viewed history
 * (not page data, since it's inherently per-shopper), excludes the product currently being viewed,
 * and renders a compact rail. Self-hides with fewer than two items. §08 recently-viewed.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { Carousel } from '../components/Carousel';
import { CompactProductCard } from '../components/CompactProductCard';
import { useRecentlyViewed } from '../../../state/recently-viewed';
import { SectionShell } from './SectionShell';
import { productDetailOf } from './section-data';
import { text } from './section-settings';

export function RecentlyViewedSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title', 'Recently viewed');
  const { items } = useRecentlyViewed();
  const currentId = productDetailOf(context)?.id;
  const products = items.filter((p) => p.id !== currentId);

  if (products.length < 2) return null;

  return (
    <SectionShell title={title}>
      <Carousel ariaLabel={title} itemClassName="sf-rail-item sf-rail-item--compact" showDots={false}>
        {products.map((product) => (
          <CompactProductCard key={product.id} product={product} />
        ))}
      </Carousel>
    </SectionShell>
  );
}
