/**
 * Textarea — multi-line input (review, gift note, message). Floating label like Input; body sans
 * at `--lh 1.6`; vertical resize only. See §32.2.
 */
import { useId, type ReactElement, type Ref, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'> {
  label: string;
  hint?: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea(props: TextareaProps): ReactElement {
  const {
    label,
    hint,
    error,
    id,
    rows = 3,
    className,
    'aria-describedby': ariaDescribedBy,
    ref,
    ...rest
  } = props;

  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('sf-field', 'sf-field--float', error && 'sf-field--error', className)}>
      <div className="sf-field__box">
        <textarea
          id={fieldId}
          ref={ref}
          rows={rows}
          className={cn('sf-control', 'sf-control--textarea')}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        <label htmlFor={fieldId} className="sf-field__label">
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
