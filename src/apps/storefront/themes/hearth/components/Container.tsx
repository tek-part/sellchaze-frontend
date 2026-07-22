/**
 * Container — the horizontal measure. Centres content to `--container` (or `--container-narrow`),
 * applying the responsive `--gutter`. Logical inline padding, so RTL is automatic.
 */
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** Narrow measure (`--container-narrow`) for reading columns. */
  narrow?: boolean;
  /** Wide measure for galleries / roomsets. */
  wide?: boolean;
  /** Drop the inline gutter (full-bleed children manage their own padding). */
  flush?: boolean;
  as?: ElementType;
  children: ReactNode;
}

export function Container(props: ContainerProps): ReactElement {
  const { narrow = false, wide = false, flush = false, as: Tag = 'div', className, children, ...rest } = props;
  return (
    <Tag
      className={cn(
        'hh-container',
        narrow && 'hh-container--narrow',
        wide && 'hh-container--wide',
        flush && 'hh-container--flush',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
