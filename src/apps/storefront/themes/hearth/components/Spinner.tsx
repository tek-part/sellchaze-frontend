/**
 * Spinner — inline loading indicator (button-busy, async surfaces). Purely decorative; callers
 * expose the loading state to assistive tech via `aria-busy`/live regions.
 */
import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md';
}

export function Spinner(props: SpinnerProps): ReactElement {
  const { size = 'sm', className, ...rest } = props;
  return <span className={cn('hh-spinner', `hh-spinner--${size}`, className)} {...rest} />;
}
