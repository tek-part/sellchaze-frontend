/**
 * Input — single-line text with an always-present floating label (tracked-caps on focus/fill) and
 * inline `--danger` error text. Placeholder is a space so `:placeholder-shown` drives the label;
 * never use the placeholder as the label. See §32.2.
 */
import { useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'placeholder'> {
  /** Visible, accessible label (floats above the field on focus/fill). */
  label: string;
  hint?: string;
  /** Error message; sets `aria-invalid` and the danger border. */
  error?: string;
  inputSize?: 'md' | 'lg';
  /** Hairline-underline variant (footer / inline search). */
  underline?: boolean;
  leadingIcon?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Input(props: InputProps): ReactElement {
  const {
    label,
    hint,
    error,
    inputSize = 'md',
    underline = false,
    leadingIcon,
    id,
    className,
    'aria-describedby': ariaDescribedBy,
    ref,
    ...rest
  } = props;

  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('sf-field', 'sf-field--float', error && 'sf-field--error', className)}>
      <div className={cn('sf-field__box', Boolean(leadingIcon) && 'sf-field__box--icon')}>
        {leadingIcon ? (
          <span className="sf-field__icon" aria-hidden>
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cn('sf-control', inputSize === 'lg' && 'sf-control--lg', underline && 'sf-control--underline')}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        <label htmlFor={inputId} className="sf-field__label">
          {label}
        </label>
      </div>
      {error ? (
        <p id={errorId} className="sf-field__error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="sf-field__hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
