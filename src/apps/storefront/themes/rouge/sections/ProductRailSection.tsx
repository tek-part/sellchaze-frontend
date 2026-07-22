/**
 * Rouge product rails — new-arrivals, best-sellers, product-carousel, related-products. One
 * implementation: a Carousel of ProductCards, optionally rank-badged for best-sellers. Reads its set
 * from page data by `source`; self-hides when empty.
 */
import type { ReactElement } from 'react';
import type { SectionComponent, SectionRenderProps } from '../../../theme-engine/rendering';
import { Carousel } from '../components/Carousel';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { SectionShell } from './SectionShell';
import { isLoading, productsFor } from './section-data';
import { range, text } from './section-settings';

interface RailConfig {
  defaultSource: string;
  defaultTitle?: string;
  defaultEyebrow?: string;
  rank?: boolean;
  viewAllHref?: string;
}

function makeProductRail(config: RailConfig): SectionComponent {
  function ProductRail(props: SectionRenderProps): ReactElement | null {
    const { settings, context } = props;
    const title = text(settings, 'title', config.defaultTitle ?? '');
    const eyebrow = text(settings, 'eyebrow', config.defaultEyebrow ?? '');
    const source = text(settings, 'source', config.defaultSource);
    const limit = range(settings, 'limit', 12, 1, 24);
    const viewAll = text(settings, 'view_all_url', config.viewAllHref ?? '');
    const loading = isLoading(context);
    const products = productsFor(context, source).slice(0, limit);

    if (!loading && products.length === 0) return null;

    return (
      <SectionShell
        {...(eyebrow ? { eyebrow } : {})}
        {...(title ? { title } : {})}
        {...(viewAll ? { viewAllHref: viewAll } : {})}
      >
        <Carousel ariaLabel={title || 'Products'} itemClassName="rge-rail-item">
          {loading
            ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product, i) => {
                const carded = config.rank ? { ...product, badge: `No. ${String(i + 1).padStart(2, '0')}` } : product;
                return <ProductCard key={product.id} product={carded} />;
              })}
        </Carousel>
      </SectionShell>
    );
  }
  return ProductRail;
}

export const ProductCarouselSection = makeProductRail({ defaultSource: 'featured' });
export const NewArrivalsSection = makeProductRail({ defaultSource: 'newest', defaultTitle: 'New arrivals', defaultEyebrow: 'Just dropped' });
export const BestSellersSection = makeProductRail({ defaultSource: 'bestsellers', defaultTitle: 'Bestsellers', defaultEyebrow: 'Most-loved', rank: true });
export const RelatedProductsSection = makeProductRail({ defaultSource: 'related', defaultTitle: 'You may also like', defaultEyebrow: 'Complete the ritual' });
