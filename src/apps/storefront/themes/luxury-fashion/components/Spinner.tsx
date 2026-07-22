/**
 * Spinner — a thin ring for inline/loading affordances. Sized in `em`, so it inherits the
 * surrounding font-size (a Button spinner matches the label). Reduced-motion is honoured globally.
 */
import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Accessible label. Omit (and pass `aria-hidden`) when the spinner is decorative. */
  label?: string;
}

export function Spinner(props: SpinnerProps): ReactElement {
  const { label, className, ...rest } = props;
  const decorative = rest['aria-hidden'] === true || rest['aria-hidden'] === 'true';
  return (
    <span
      className={cn('sf-spinner', className)}
      role={decorative ? undefined : 'status'}
      aria-label={decorative ? undefined : (label ?? 'Loading')}
      {...rest}
    />
  );
}
