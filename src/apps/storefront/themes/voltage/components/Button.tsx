/**
 * Voltage Button — decisive action. Uppercase grotesque label, 10px radius, cyan/lime fills with a
 * neon glow-on-hover and a subtle press. Voltage's own component — no Theme 01 code reused.
 */
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function Button(props: ButtonProps): ReactElement {
  const {
    variant = 'primary',
    size = 'md',
    block = false,
    loading = false,
    icon,
    disabled,
    className,
    children,
    type = 'button',
    ref,
    ...rest
  } = props;
  return (
    <button
      ref={ref}
      type={type}
      className={cn('vlt-btn', `vlt-btn--${variant}`, `vlt-btn--${size}`, block && 'vlt-btn--block', loading && 'vlt-btn--loading', className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner aria-hidden /> : null}
      <span className="vlt-btn__label">
        {icon ? <span className="vlt-btn__icon" aria-hidden>{icon}</span> : null}
        {children}
      </span>
    </button>
  );
}
