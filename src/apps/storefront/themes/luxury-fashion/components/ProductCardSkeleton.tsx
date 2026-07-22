/**
 * ProductCardSkeleton — a loading placeholder that mirrors ProductCard's footprint (4:5 media + two
 * text lines) so grids don't shift when data arrives (CLS-safe). See §32.5.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Skeleton } from './Skeleton';

export function ProductCardSkeleton(props: { className?: string }): ReactElement {
  return (
    <div className={cn('sf-product-card', props.className)} aria-hidden>
      <Skeleton variant="image" />
      <div className="sf-product-card__body">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}
