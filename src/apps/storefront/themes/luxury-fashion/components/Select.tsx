/**
 * Select — native single-choice control with a thin 45° chevron. Uses a static tracked-caps label
 * (native selects have no `:placeholder-shown`), an optional disabled placeholder option, and inline
 * error text. For >7 options a search-in-select is preferred (a later custom-popover variant). §32.2.
 */
import { useId, type ReactElement, type Ref, type SelectHTMLAttributes } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  hint?: string;
  error?: string;
  selectSize?: 'md' | 'lg';
  options: ReadonlyArray<SelectOption>;
  /** Disabled leading option shown when no value is selected. */
  placeholder?: string;
  ref?: Ref<HTMLSelectElement>;
}

export function Select(props: SelectProps): ReactElement {
  const {
    label,
    hint,
    error,
    selectSize = 'md',
    options,
    placeholder,
    id,
    className,
    defaultValue,
    value,
    'aria-describedby': ariaDescribedBy,
    ref,
    ...rest
  } = props;

  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId, hintId].filter(Boolean).join(' ') || undefined;
  const controlled = value !== undefined;
  const placeholderValue = controlled ? (value ?? '') : (defaultValue ?? '');

  return (
    <div className={cn('sf-field', error && 'sf-field--error', className)}>
      <label htmlFor={selectId} className="sf-field__label sf-field__label--static">
        {label}
      </label>
      <div className="sf-field__box sf-field__box--select">
        <select
          id={selectId}
          ref={ref}
          className={cn('sf-control', 'sf-select', selectSize === 'lg' && 'sf-control--lg')}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...(controlled ? { value } : { defaultValue: placeholderValue })}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
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
