/**
 * Section — vertical rhythm wrapper. Applies the responsive `--section-y` block padding that
 * gives the theme its generous editorial breathing room. Pair with `Container` for the measure.
 */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** Reduced block padding for dense/secondary bands. */
  tight?: boolean;
  as?: ElementType;
  children: ReactNode;
}

export function Section(props: SectionProps): ReactElement {
  const { tight = false, as: Tag = 'section', className, children, ...rest } = props;
  return (
    <Tag className={cn('sf-section', tight && 'sf-section--tight', className)} {...rest}>
      {children}
    </Tag>
  );
}
