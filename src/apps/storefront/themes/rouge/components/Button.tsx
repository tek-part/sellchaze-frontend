/**
 * Rouge Button — a pill of commitment. Uppercase humanist label, pill radius, rouge/gilt fills with a
 * soft rose-bloom lift on hover and a subtle press. Rouge's own component — no other theme reused.
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
      className={cn('rge-btn', `rge-btn--${variant}`, `rge-btn--${size}`, block && 'rge-btn--block', loading && 'rge-btn--loading', className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner aria-hidden /> : null}
      <span className="rge-btn__label">
        {icon ? <span className="rge-btn__icon" aria-hidden>{icon}</span> : null}
        {children}
      </span>
    </button>
  );
}
