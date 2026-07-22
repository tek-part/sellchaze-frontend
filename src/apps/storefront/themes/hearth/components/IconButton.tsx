/**
 * IconButton — compact icon-only affordance (save, search, close, filter). Always carries an
 * accessible label; toggle usage sets `aria-pressed`. ≥44px hit area even when the glyph is smaller.
 */
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type IconButtonVariant = 'ghost' | 'filled' | 'accent';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — the control is icon-only, so it must name itself for assistive tech. */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Toggle state (renders `aria-pressed`). */
  pressed?: boolean;
  icon: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton(props: IconButtonProps): ReactElement {
  const { label, variant = 'ghost', size = 'md', pressed, icon, className, type = 'button', ref, ...rest } = props;
  return (
    <button
      ref={ref}
      type={type}
      className={cn('hh-icon-btn', `hh-icon-btn--${variant}`, `hh-icon-btn--${size}`, className)}
      aria-label={label}
      {...(pressed !== undefined ? { 'aria-pressed': pressed } : {})}
      {...rest}
    >
      <span className="hh-icon-btn__glyph" aria-hidden>
        {icon}
      </span>
    </button>
  );
}
