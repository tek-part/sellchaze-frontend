/**
 * Product rails — new-arrivals, best-sellers, product-carousel, related-products, recently-viewed.
 * All share one implementation: a Carousel of ProductCards (or CompactProductCards for the compact
 * recently-viewed rail), optionally numbered for best-sellers. Reads its product set from the page
 * data by `source`; self-hides when empty. §08 new-arrivals/best-sellers/related/recently-viewed.
 */
import type { ReactElement } from 'react';
import type { SectionComponent, SectionRenderProps } from '../../../theme-engine/rendering';
import { Carousel } from '../components/Carousel';
import { CompactProductCard } from '../components/CompactProductCard';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { SectionShell } from './SectionShell';
import { isLoading, productsFor } from './section-data';
import { range, text } from './section-settings';
import { cn } from '../../../../../shared/utils/cn';

interface RailConfig {
  defaultSource: string;
  defaultTitle?: string;
  rank?: boolean;
  compact?: boolean;
  viewAllHref?: string;
}

function makeProductRail(config: RailConfig): SectionComponent {
  function ProductRail(props: SectionRenderProps): ReactElement | null {
    const { settings, context } = props;
    const title = text(settings, 'title', config.defaultTitle ?? '');
    const source = text(settings, 'source', config.defaultSource);
    const limit = range(settings, 'limit', 12, 1, 24);
    const loading = isLoading(context);
    const products = productsFor(context, source).slice(0, limit);

    if (!loading && products.length === 0) return null;

    const itemClass = cn('sf-rail-item', config.compact && 'sf-rail-item--compact');

    return (
      <SectionShell
        title={title || undefined}
        {...(config.viewAllHref ? { viewAllHref: config.viewAllHref } : {})}
      >
        <Carousel ariaLabel={title || 'Products'} itemClassName={itemClass} showDots={false}>
          {loading
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product, i) => {
                if (config.compact) {
                  return <CompactProductCard key={product.id} product={product} {...(config.rank ? { rank: i + 1 } : {})} />;
                }
                const carded = config.rank
                  ? { ...product, badge: `No. ${String(i + 1).padStart(2, '0')}` }
                  : product;
                return <ProductCard key={product.id} product={carded} />;
              })}
        </Carousel>
      </SectionShell>
    );
  }
  return ProductRail;
}

export const ProductCarouselSection = makeProductRail({ defaultSource: 'featured' });
export const NewArrivalsSection = makeProductRail({ defaultSource: 'newest', defaultTitle: 'New arrivals' });
export const BestSellersSection = makeProductRail({ defaultSource: 'bestsellers', defaultTitle: 'Best sellers', rank: true });
export const RelatedProductsSection = makeProductRail({ defaultSource: 'related', defaultTitle: 'You may also like' });
