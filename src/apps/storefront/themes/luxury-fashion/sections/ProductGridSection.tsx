/**
 * product-grid — merchandise a product set (featured/newest/category/sale). ProductCard grid +
 * SectionHead. Settings: title, source, limit, columns, show_price. Reads products from the page's
 * data slice; shows CLS-safe skeletons while loading and self-hides (or an empty state) with no data.
 * §08 product-grid.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { EmptyState, ErrorState } from '../components/StateMessage';
import { SectionShell } from './SectionShell';
import { isLoading, productsFor, errorMessage, hasError, hasNoProductData } from './section-data';
import { flag, option, range, text } from './section-settings';

const SOURCES = ['featured', 'newest', 'bestsellers', 'sale', 'category', 'all'] as const;

function gridStyle(columns: number): CSSProperties {
  return {
    '--sf-cols': columns,
    '--sf-cols-lg': Math.min(columns, 3),
    '--sf-cols-md': 2,
    '--sf-cols-sm': columns >= 4 ? 2 : 1,
  } as CSSProperties;
}

export function ProductGridSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const source = option(settings, 'source', SOURCES, 'featured');
  const limit = range(settings, 'limit', 8, 1, 24);
  const columns = range(settings, 'columns', 4, 2, 6);
  const showQuickAdd = flag(settings, 'show_quick_add', false);
  const loading = isLoading(context);
  const products = productsFor(context, source).slice(0, limit);

  // A failure is not an empty shelf — say so, and announce it, rather than rendering nothing.
  if (hasError(context) && hasNoProductData(context)) {
    return (
      <SectionShell {...(title ? { title } : {})}>
        <ErrorState title="Couldn’t load products" description={errorMessage(context)} />
      </SectionShell>
    );
  }

  if (!loading && products.length === 0) {
    if (!title) return null;
    return (
      <SectionShell title={title}>
        <EmptyState variant="search" title="Nothing here yet" description="New pieces are on their way." />
      </SectionShell>
    );
  }

  return (
    <SectionShell title={title || undefined}>
      <div className="sf-grid" style={gridStyle(columns)}>
        {loading
          ? Array.from({ length: limit }, (_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => (
              <ProductCard key={product.id} product={product} showQuickAdd={showQuickAdd} />
            ))}
      </div>
    </SectionShell>
  );
}
