/** Rouge Select — native, uppercase label, soft chevron. */
import { useId, type ReactElement, type SelectHTMLAttributes } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface SelectOption { value: string; label: string; disabled?: boolean; }
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string; options: ReadonlyArray<SelectOption>; error?: string;
}
export function Select(props: SelectProps): ReactElement {
  const { label, options, error, id, className, ...rest } = props;
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={cn('rge-field', className)}>
      <label className="rge-label" htmlFor={selectId}>{label}</label>
      <div className="rge-select-wrap">
        <select id={selectId} className="rge-control rge-select" aria-invalid={error ? true : undefined} {...rest}>
          {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
      </div>
      {error ? <p className="rge-field__error" role="alert">{error}</p> : null}
    </div>
  );
}
