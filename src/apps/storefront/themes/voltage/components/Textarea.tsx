/** Voltage Textarea — matches Input; multi-line. */
import { useId, type ReactElement, type Ref, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../../../../shared/utils/cn';
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label: string; error?: string; ref?: Ref<HTMLTextAreaElement>; }
export function Textarea(props: TextareaProps): ReactElement {
  const { label, error, id, className, rows = 4, ref, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn('vlt-field', className)}>
      <label className="vlt-label" htmlFor={fieldId}>{label}</label>
      <textarea id={fieldId} ref={ref} rows={rows} className="vlt-control" style={{ resize: 'vertical' }} aria-invalid={error ? true : undefined} {...rest} />
      {error ? <p className="vlt-field__error" role="alert">{error}</p> : null}
    </div>
  );
}
