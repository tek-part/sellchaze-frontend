/**
 * ButtonLink — an anchor styled exactly as Button. Use for navigational CTAs (hero, banners) where
 * a real link is correct; Button stays for actions.
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
      className={cn('hh-btn', `hh-btn--${variant}`, `hh-btn--${size}`, block && 'hh-btn--block', className)}
      {...rest}
    >
      <span className="hh-btn__label">
        {icon ? (
          <span className="hh-btn__icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </span>
    </a>
  );
}
