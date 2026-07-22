/**
 * LinkButton — a text link affordance (not a filled button). `arrow` variant adds a trailing chevron
 * that nudges on hover; `plain` is an inline underlined link. Terracotta ink, gentle motion.
 */
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type LinkButtonVariant = 'arrow' | 'plain';

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LinkButtonVariant;
  children: ReactNode;
}

export function LinkButton(props: LinkButtonProps): ReactElement {
  const { variant = 'plain', className, children, ...rest } = props;
  return (
    <a className={cn('hh-link', `hh-link--${variant}`, className)} {...rest}>
      <span className="hh-link__label">{children}</span>
      {variant === 'arrow' ? (
        <span className="hh-link__arrow" aria-hidden>
          →
        </span>
      ) : null}
    </a>
  );
}
