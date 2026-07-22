/** Voltage Input — mono uppercase label over a bordered field; inline error. */
import { useId, type InputHTMLAttributes, type ReactElement, type Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string; error?: string; hint?: string; ref?: Ref<HTMLInputElement>;
}
export function Input(props: InputProps): ReactElement {
  const { label, error, hint, id, className, 'aria-describedby': describedBy, ref, ...rest } = props;
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const described = [describedBy, errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('vlt-field', className)}>
      <label className="vlt-label" htmlFor={inputId}>{label}</label>
      <input id={inputId} ref={ref} className="vlt-control" aria-invalid={error ? true : undefined} aria-describedby={described} {...rest} />
      {error ? <p id={errorId} className="vlt-field__error" role="alert">{error}</p> : hint ? <p id={hintId} className="vlt-field__error" style={{ color: 'var(--muted)' }}>{hint}</p> : null}
    </div>
  );
}
