/**
 * Skeleton — loading placeholder that reserves the final layout (zero CLS). Soft warm shimmer that
 * stops under reduced motion. `aria-hidden`; the async container announces "Loading" via a live
 * region.
 */
import type { CSSProperties, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type SkeletonVariant = 'line' | 'media' | 'card' | 'price' | 'text';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Explicit width (CSS length). */
  width?: string;
  /** Aspect ratio for `media` (e.g. "4 / 5"). */
  ratio?: string;
  className?: string;
}

export function Skeleton(props: SkeletonProps): ReactElement {
  const { variant = 'line', width, ratio, className } = props;
  const style: CSSProperties = {};
  if (width) style.width = width;
  if (ratio) style.aspectRatio = ratio;
  return <span className={cn('hh-skeleton', `hh-skeleton--${variant}`, className)} style={style} aria-hidden />;
}

export interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton(props: ProductCardSkeletonProps): ReactElement {
  const { className } = props;
  return (
    <div className={cn('hh-product-card hh-product-card--skeleton', className)} aria-hidden>
      <Skeleton variant="media" ratio="4 / 5" />
      <div className="hh-product-card__body">
        <Skeleton variant="line" width="70%" />
        <Skeleton variant="price" width="40%" />
      </div>
    </div>
  );
}
