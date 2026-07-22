/**
 * IconButton — icon-only chrome control (bag, search, account, wishlist, close).
 * MUST carry an accessible label; never below the 44px tap target. See §32.1.
 */
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export type IconButtonVariant = 'default' | 'active' | 'subtle';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name — the control has no visible text. */
  label: string;
  variant?: IconButtonVariant;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function IconButton(props: IconButtonProps): ReactElement {
  const { label, variant = 'default', className, children, type = 'button', ref, ...rest } = props;
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn('sf-icon-btn', variant !== 'default' && `sf-icon-btn--${variant}`, className)}
      {...rest}
    >
      <span aria-hidden className="sf-icon-btn__glyph">
        {children}
      </span>
    </button>
  );
}
