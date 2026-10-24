/**
 * Stride product set — the library's four product layouts (grid · carousel · list · featured-first)
 * rendered with the Stride card, so every product rail in the theme reads the same.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { LibCarousel, LibEmpty, LibGrid, LibProductSkeleton, gridStyle } from '../../../sections-lib';
import { StProductCard, type StProductCardProps } from './ProductCard';

export type StCardOptions = Pick<StProductCardProps, 'showBadges' | 'showRatings' | 'showQuickAdd' | 'showWishlist'>;

export interface StProductSetProps {
  layout: string;
  products: ReadonlyArray<ProductCardModel>;
  columns: number;
  card: StCardOptions;
  ariaLabel: string;
  emptyMessage: string;
  loading?: boolean;
  limit?: number;
}

export function StProductSet(props: StProductSetProps): ReactElement {
  const { layout, products, columns, card, ariaLabel, emptyMessage, loading = false, limit = 8 } = props;
  if (loading && products.length === 0) {
    return <LibGrid style={gridStyle(columns)}>{Array.from({ length: Math.min(limit, columns * 2) }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>;
  }
  if (products.length === 0) return <LibEmpty message={emptyMessage} />;
  switch (layout) {
    case 'carousel':
      return (
        <LibCarousel ariaLabel={ariaLabel} itemSize="card" className="st-rail-lib">
          {products.map((p) => <StProductCard key={p.id} product={p} {...card} sizes="(min-width: 1024px) 280px, 46vw" />)}
        </LibCarousel>
      );
    case 'list':
      return (
        <LibGrid style={gridStyle(Math.min(columns, 2), 1)} className="lib-grid--list">
          {products.map((p) => <StProductCard key={p.id} product={p} {...card} variant="list" sizes="220px" />)}
        </LibGrid>
      );
    case 'featured-first':
      return (
        <LibGrid style={gridStyle(Math.max(columns, 3))} className="lib-grid--featured st-grid--featured">
          {products.map((p, i) => <StProductCard key={p.id} product={p} {...card} variant={i === 0 ? 'feature' : 'card'} />)}
        </LibGrid>
      );
    default:
      return (
        <LibGrid style={gridStyle(columns)} className={cn('st-grid', columns >= 5 && 'lib-grid--dense')}>
          {products.map((p) => <StProductCard key={p.id} product={p} {...card} />)}
        </LibGrid>
      );
  }
}
