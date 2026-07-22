/**
 * ButtonLink — an anchor styled exactly as Button (same skin, gold underline on primary). Use for
 * navigational CTAs (hero, banners) where a real link is correct; Button stays for actions.
 */
import type { AnchorHTMLAttributes, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ButtonSize, ButtonVariant } from './Button';

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function ButtonLink(props: ButtonLinkProps): ReactElement {
  const { variant = 'primary', size = 'md', block = false, icon, className, children, ...rest } = props;
  return (
    <a
      className={cn('sf-btn', `sf-btn--${variant}`, `sf-btn--${size}`, block && 'sf-btn--block', className)}
      {...rest}
    >
      <span className="sf-btn__label">
        {icon ? (
          <span className="sf-btn__icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </span>
    </a>
  );
}
