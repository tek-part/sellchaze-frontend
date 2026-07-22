/** Rouge Container — the measure. Logical inline padding (RTL-safe). */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  narrow?: boolean;
  as?: ElementType;
  children: ReactNode;
}
export function Container(props: ContainerProps): ReactElement {
  const { narrow = false, as: Tag = 'div', className, children, ...rest } = props;
  return (
    <Tag className={cn('rge-container', narrow && 'rge-container--narrow', className)} {...rest}>
      {children}
    </Tag>
  );
}
