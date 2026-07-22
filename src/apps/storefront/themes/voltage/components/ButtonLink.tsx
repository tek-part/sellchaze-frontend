/** Voltage ButtonLink — anchor styled as the Voltage Button (navigational CTAs). */
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
    <a className={cn('vlt-btn', `vlt-btn--${variant}`, `vlt-btn--${size}`, block && 'vlt-btn--block', className)} {...rest}>
      <span className="vlt-btn__label">
        {icon ? <span className="vlt-btn__icon" aria-hidden>{icon}</span> : null}
        {children}
      </span>
    </a>
  );
}
