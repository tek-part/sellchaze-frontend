/** Voltage IconButton — icon-only chrome control; required label; 44px tap target. */
import type { ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function IconButton(props: IconButtonProps): ReactElement {
  const { label, className, children, type = 'button', ref, ...rest } = props;
  return (
    <button ref={ref} type={type} aria-label={label} title={label} className={cn('vlt-icon-btn', className)} {...rest}>
      <span aria-hidden>{children}</span>
    </button>
  );
}
