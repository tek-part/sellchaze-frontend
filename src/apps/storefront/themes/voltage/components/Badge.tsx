/** Voltage Badge — mono uppercase status chip (new/sale/stock/outline). */
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type BadgeVariant = 'new' | 'sale' | 'stock' | 'outline';
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}
export function Badge(props: BadgeProps): ReactElement {
  const { variant = 'outline', className, children, ...rest } = props;
  return <span className={cn('vlt-badge', `vlt-badge--${variant}`, className)} {...rest}>{children}</span>;
}
