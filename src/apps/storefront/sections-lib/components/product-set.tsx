/**
 * Shared product-set rendering for featured-products / product-tabs / flash-deals: one `layout`
 * variant set (grid · carousel · list · featured-first) and one renderer so the three sections
 * stay visually identical and a theme override can reuse them.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../shared/utils/cn';
import type { ProductCardModel } from '../../types/catalog';
import { fields, variants } from '../schema';
import { gridStyle } from '../use-section';
import { LibCarousel, LibEmpty, LibGrid, LibProductCard, LibProductSkeleton, type LibProductCardProps } from '../primitives';

export const PRODUCT_LAYOUTS = variants('layout', [
  { value: 'grid', label: 'Grid', description: 'Even columns of product cards.', icon: 'HiOutlineSquares2X2' },
  { value: 'carousel', label: 'Carousel', description: 'A scrolling rail with arrows.', icon: 'HiOutlineArrowsRightLeft' },
  { value: 'list', label: 'List', description: 'Horizontal cards with more detail.', icon: 'HiOutlineListBullet' },
  { value: 'featured-first', label: 'Featured first', description: 'The first product large, the rest in a grid.', icon: 'HiOutlineRectangleGroup' },
]);

export const PRODUCT_CARD_FIELDS = [
  fields.toggle('show_badges', 'Show badges (sale %, new)', true),
  fields.toggle('show_ratings', 'Show ratings', true),
  fields.toggle('show_quick_add', 'Show quick add', true),
  fields.toggle('show_wishlist', 'Show wishlist heart', true),
] as const;

export type ProductCardOptions = Pick<LibProductCardProps, 'showBadges' | 'showRatings' | 'showQuickAdd' | 'showWishlist'>;

export interface ProductSetProps {
  layout: string;
  products: ReadonlyArray<ProductCardModel>;
  columns: number;
  card: ProductCardOptions;
  ariaLabel: string;
  emptyMessage: string;
  /** Skeleton state (first load without data). */
  loading?: boolean;
  limit?: number;
}

export function ProductSet(props: ProductSetProps): ReactElement {
  const { layout, products, columns, card, ariaLabel, emptyMessage, loading = false, limit = 8 } = props;
  if (loading && products.length === 0) {
    return <LibGrid style={gridStyle(columns)}>{Array.from({ length: Math.min(limit, columns * 2) }, (_, i) => <LibProductSkeleton key={i} />)}</LibGrid>;
  }
  if (products.length === 0) return <LibEmpty message={emptyMessage} />;
  switch (layout) {
    case 'carousel':
      return (
        <LibCarousel ariaLabel={ariaLabel} itemSize="card">
          {products.map((p, i) => <LibProductCard key={p.id} product={p} {...card} eager={i < columns} />)}
        </LibCarousel>
      );
    case 'list':
      return (
        <LibGrid style={gridStyle(Math.min(columns, 2), 1)} className="lib-grid--list">
          {products.map((p, i) => <LibProductCard key={p.id} product={p} {...card} style="list" eager={i < 2} />)}
        </LibGrid>
      );
    case 'featured-first':
      return (
        <LibGrid style={gridStyle(Math.max(columns, 3))} className="lib-grid--featured">
          {products.map((p, i) => <LibProductCard key={p.id} product={p} {...card} eager={i < columns} style={i === 0 ? 'feature' : 'card'} />)}
        </LibGrid>
      );
    default:
      return (
        <LibGrid style={gridStyle(columns)} className={cn(columns >= 5 && 'lib-grid--dense')}>
          {products.map((p, i) => <LibProductCard key={p.id} product={p} {...card} eager={i < columns} />)}
        </LibGrid>
      );
  }
}
