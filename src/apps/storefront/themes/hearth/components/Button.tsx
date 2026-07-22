/**
 * Button — the decisive commit control (Add to cart, Checkout, Subscribe). Terracotta primary,
 * warm secondary, quiet ghost. One primary per view. Soft radius, gentle settle on press.
 */
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width (mobile CTAs, buy box). */
  block?: boolean;
  /** Shows an inline spinner and dims the label; also disables the control. */
  loading?: boolean;
  /** Leading icon. */
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
      className={cn(
        'hh-btn',
        `hh-btn--${variant}`,
        `hh-btn--${size}`,
        block && 'hh-btn--block',
        loading && 'hh-btn--loading',
        className,
      )}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner aria-hidden /> : null}
      <span className="hh-btn__label">
        {icon ? (
          <span className="hh-btn__icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </span>
    </button>
  );
}
