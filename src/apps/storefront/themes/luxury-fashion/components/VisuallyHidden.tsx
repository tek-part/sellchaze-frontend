/**
 * VisuallyHidden — content available to assistive tech but not painted (skip-link targets, extra
 * labels, live-region text). Uses the `sr-only` utility from the design-system CSS.
 */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children: ReactNode;
}

export function VisuallyHidden(props: VisuallyHiddenProps): ReactElement {
  const { as: Tag = 'span', className, children, ...rest } = props;
  return (
    <Tag className={cn('sr-only', className)} {...rest}>
      {children}
    </Tag>
  );
}
