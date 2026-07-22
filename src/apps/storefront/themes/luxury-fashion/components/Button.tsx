/**
 * Button — the decisive commit control (Add to cart, Checkout, Subscribe).
 * Three tiers cover every action; one primary per view. See 32-component-library §32.1.
 */
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width (mobile CTAs, buy box). */
  block?: boolean;
  /** Shows an inline spinner and dims the label; also disables the control. */
  loading?: boolean;
  /** Leading icon (rendered before the label, inside the underline group). */
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
        'sf-btn',
        `sf-btn--${variant}`,
        `sf-btn--${size}`,
        block && 'sf-btn--block',
        loading && 'sf-btn--loading',
        className,
      )}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner aria-hidden /> : null}
      <span className="sf-btn__label">
        {icon ? (
          <span className="sf-btn__icon" aria-hidden>
            {icon}
          </span>
        ) : null}
        {children}
      </span>
    </button>
  );
}
