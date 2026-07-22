/**
 * Input — a labelled text field with optional help + error. Error ties to the control via
 * `aria-describedby` + `aria-invalid`; required is shown in text, never colour-only. Payment card
 * fields are never rendered by the theme (provider-hosted) — this is for contact/address/search.
 */
import { useId, type InputHTMLAttributes, type ReactElement, type Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
  /** Visually hide the label (still read by assistive tech). */
  hideLabel?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Input(props: InputProps): ReactElement {
  const { label, help, error, hideLabel = false, id, className, required, ref, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = help ? `${fieldId}-help` : undefined;
  const errId = error ? `${fieldId}-err` : undefined;
  const describedBy = [helpId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('hh-field', error && 'hh-field--error', className)}>
      {label ? (
        <label htmlFor={fieldId} className={cn('hh-field__label', hideLabel && 'hh-visually-hidden')}>
          {label}
          {required ? <span className="hh-field__req"> (required)</span> : null}
        </label>
      ) : null}
      <input
        ref={ref}
        id={fieldId}
        className="hh-input"
        required={required}
        aria-invalid={error ? true : undefined}
        {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        {...rest}
      />
      {help && !error ? (
        <p id={helpId} className="hh-field__help">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="hh-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
