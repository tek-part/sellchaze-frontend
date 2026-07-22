/** Rouge Section — generous vertical-rhythm wrapper. */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tight?: boolean;
  as?: ElementType;
  children: ReactNode;
}
export function Section(props: SectionProps): ReactElement {
  const { tight = false, as: Tag = 'section', className, children, ...rest } = props;
  return (
    <Tag className={cn('rge-section', tight && 'rge-section--tight', className)} {...rest}>
      {children}
    </Tag>
  );
}
