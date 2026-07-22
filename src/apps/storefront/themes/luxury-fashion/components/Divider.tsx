/**
 * Divider — a 1px hairline (`--border`), the theme's structural separator in place of shadows.
 * The `accent` variant is the short gold rule used under eyebrows/category labels.
 */
import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Short champagne-gold rule (used as a decorative accent under labels). */
  accent?: boolean;
}

export function Divider(props: DividerProps): ReactElement {
  const { accent = false, className, ...rest } = props;
  return <hr className={cn('sf-divider', accent && 'sf-divider--accent', className)} {...rest} />;
}
