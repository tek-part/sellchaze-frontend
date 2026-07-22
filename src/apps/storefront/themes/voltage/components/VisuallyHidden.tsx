/** Voltage VisuallyHidden — content for assistive tech only (uses the sr-only utility). */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> { as?: ElementType; children: ReactNode; }
export function VisuallyHidden(props: VisuallyHiddenProps): ReactElement {
  const { as: Tag = 'span', className, children, ...rest } = props;
  return <Tag className={cn('sr-only', className)} {...rest}>{children}</Tag>;
}
