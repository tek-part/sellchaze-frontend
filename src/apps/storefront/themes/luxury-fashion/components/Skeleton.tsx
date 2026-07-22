/**
 * Skeleton — loading placeholder that mirrors the final layout with a slow warm shimmer (not a fast
 * pulse). MUST preserve the target's dimensions to keep CLS < 0.1. See §32.5.
 */
import type { CSSProperties, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type SkeletonVariant = 'text' | 'image' | 'block' | 'circle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  /** Number of stacked lines (text variant). */
  lines?: number;
  /** Override aspect-ratio for the image variant (e.g. "3/2"). */
  ratio?: string;
  className?: string;
  style?: CSSProperties;
}

function dim(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export function Skeleton(props: SkeletonProps): ReactElement {
  const { variant = 'text', width, height, lines = 1, ratio, className, style } = props;

  if (variant === 'text' && lines > 1) {
    return (
      <span className={cn('sf-skeleton-lines', className)} aria-hidden>
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className="sf-skeleton sf-skeleton--text"
            style={{ width: i === lines - 1 ? '70%' : dim(width) ?? '100%' }}
          />
        ))}
      </span>
    );
  }

  const merged: CSSProperties = {
    ...style,
    ...(dim(width) ? { width: dim(width) } : null),
    ...(dim(height) ? { height: dim(height) } : null),
    ...(ratio ? { aspectRatio: ratio } : null),
  };

  return <span className={cn('sf-skeleton', `sf-skeleton--${variant}`, className)} style={merged} aria-hidden />;
}
