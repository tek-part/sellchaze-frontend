/**
 * Tag / DiscountBadge — soft, calm status labels (New, Sale, Bestseller…). Meaningful tags are text
 * (never colour-only). DiscountBadge computes "-NN%" from real prices; it renders nothing when there
 * is no genuine markdown (no fabricated urgency).
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type TagTone = 'neutral' | 'sale' | 'sage' | 'info' | 'warning' | 'success';

export interface TagProps {
  tone?: TagTone;
  soft?: boolean;
  children: ReactNode;
  className?: string;
}

export function Tag(props: TagProps): ReactElement {
  const { tone = 'neutral', soft = true, children, className } = props;
  return (
    <span className={cn('hh-tag', `hh-tag--${tone}`, soft && 'hh-tag--soft', className)}>{children}</span>
  );
}

export interface DiscountBadgeProps {
  price: number;
  compareAt?: number;
  className?: string;
}

export function DiscountBadge(props: DiscountBadgeProps): ReactElement | null {
  const { price, compareAt, className } = props;
  if (typeof compareAt !== 'number' || compareAt <= price) return null;
  const pct = Math.round(((compareAt - price) / compareAt) * 100);
  if (pct <= 0) return null;
  return (
    <Tag tone="sale" className={className}>
      −{pct}%
    </Tag>
  );
}
