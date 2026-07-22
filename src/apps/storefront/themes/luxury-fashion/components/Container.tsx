/**
 * Container — the horizontal measure. Centres content to `--container` (or `--container-narrow`),
 * applying the responsive `--gutter`. Uses logical inline padding, so RTL is automatic.
 */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** Narrow measure (`--container-narrow`, ~760px) for reading columns. */
  narrow?: boolean;
  /** Drop the inline gutter (full-bleed children manage their own padding). */
  flush?: boolean;
  as?: ElementType;
  children: ReactNode;
}

export function Container(props: ContainerProps): ReactElement {
  const { narrow = false, flush = false, as: Tag = 'div', className, children, ...rest } = props;
  return (
    <Tag
      className={cn('sf-container', narrow && 'sf-container--narrow', flush && 'sf-container--flush', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
