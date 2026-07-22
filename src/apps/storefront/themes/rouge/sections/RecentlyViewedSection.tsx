/**
 * Rouge recently-viewed — reads the client-side recently-viewed history (per-shopper, not page data),
 * excludes the current product, and renders a compact rail. Self-hides with fewer than two items.
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
    <SectionShell title={title} tight>
      <Carousel ariaLabel={title} itemClassName="rge-rail-item rge-rail-item--compact">
        {products.map((product) => (
          <CompactProductCard key={product.id} product={product} />
        ))}
      </Carousel>
    </SectionShell>
  );
}
