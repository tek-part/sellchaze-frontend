/**
 * Badge — merchandising status (New, Sold out, Featured), and DiscountBadge — a quiet −% / amount
 * signal in bordeaux, never a shouting red box. One badge per card. Both self-hide on absent data.
 * See §32.3.
 */
import { useMemo, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type BadgeVariant = 'outline' | 'solid' | 'sale';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge(props: BadgeProps): ReactElement {
  const { variant = 'outline', className, children, ...rest } = props;
  return (
    <span className={cn('sf-badge', `sf-badge--${variant}`, className)} {...rest}>
      {children}
    </span>
  );
}

export interface DiscountBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Percentage off (e.g. 30 → "−30%"). Takes precedence over `amount`. */
  percent?: number;
  /** Absolute amount off, in major units. */
  amount?: number;
  /** Required when `amount` is used. */
  currency?: string;
  locale?: string;
}

/** Returns `null` (renders nothing) when there is no genuine discount to show. */
export function DiscountBadge(props: DiscountBadgeProps): ReactElement | null {
  const { percent, amount, currency, locale, className, ...rest } = props;

  const format = useMemo(
    () => (currency ? new Intl.NumberFormat(locale, { style: 'currency', currency }) : null),
    [locale, currency],
  );

  let label: string | null = null;
  if (typeof percent === 'number' && percent > 0) {
    label = `−${Math.round(percent)}%`;
  } else if (typeof amount === 'number' && amount > 0 && format) {
    label = `−${format.format(amount)}`;
  }
  if (!label) return null;

  return (
    <span className={cn('sf-discount', className)} {...rest}>
      {label}
    </span>
  );
}
