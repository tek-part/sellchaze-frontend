/**
 * Textarea + Select — labelled form controls sharing the Input field shell (label / help / error /
 * required-in-text / aria wiring). Kept together as the "field" family.
 */
import {
  useId,
  type ReactElement,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../../../../shared/utils/cn';

interface FieldShellProps {
  label?: string;
  help?: string;
  error?: string;
  hideLabel?: boolean;
  required?: boolean | undefined;
  id: string;
  className?: string;
}

function ids(fieldId: string, help?: string, error?: string): { helpId?: string; errId?: string; describedBy?: string } {
  const helpId = help ? `${fieldId}-help` : undefined;
  const errId = error ? `${fieldId}-err` : undefined;
  const describedBy = [helpId, errId].filter(Boolean).join(' ') || undefined;
  return {
    ...(helpId ? { helpId } : {}),
    ...(errId ? { errId } : {}),
    ...(describedBy ? { describedBy } : {}),
  };
}

function Label(props: Pick<FieldShellProps, 'label' | 'hideLabel' | 'required' | 'id'>): ReactElement | null {
  const { label, hideLabel, required, id } = props;
  if (!label) return null;
  return (
    <label htmlFor={id} className={cn('hh-field__label', hideLabel && 'hh-visually-hidden')}>
      {label}
      {required ? <span className="hh-field__req"> (required)</span> : null}
    </label>
  );
}

function Notes(props: { help?: string; error?: string; helpId?: string; errId?: string }): ReactElement | null {
  const { help, error, helpId, errId } = props;
  if (error) {
    return (
      <p id={errId} className="hh-field__error" role="alert">
        {error}
      </p>
    );
  }
  if (help) {
    return (
      <p id={helpId} className="hh-field__help">
        {help}
      </p>
    );
  }
  return null;
}

/* ------------------------------------------------------------------------- Textarea */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  help?: string;
  error?: string;
  hideLabel?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea(props: TextareaProps): ReactElement {
  const { label, help, error, hideLabel, id, className, required, ref, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { helpId, errId, describedBy } = ids(fieldId, help, error);
  return (
    <div className={cn('hh-field', error && 'hh-field--error', className)}>
      <Label label={label} hideLabel={hideLabel} required={required} id={fieldId} />
      <textarea
        ref={ref}
        id={fieldId}
        className="hh-input hh-textarea"
        required={required}
        aria-invalid={error ? true : undefined}
        {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        {...rest}
      />
      <Notes {...(help ? { help } : {})} {...(error ? { error } : {})} {...(helpId ? { helpId } : {})} {...(errId ? { errId } : {})} />
    </div>
  );
}

/* --------------------------------------------------------------------------- Select */
export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  help?: string;
  error?: string;
  hideLabel?: boolean;
  options: ReadonlyArray<SelectOption>;
  ref?: Ref<HTMLSelectElement>;
}

export function Select(props: SelectProps): ReactElement {
  const { label, help, error, hideLabel, options, id, className, required, ref, ...rest } = props;
  const autoId = useId();
  const fieldId = id ?? autoId;
  const { helpId, errId, describedBy } = ids(fieldId, help, error);
  return (
    <div className={cn('hh-field', error && 'hh-field--error', className)}>
      <Label label={label} hideLabel={hideLabel} required={required} id={fieldId} />
      <div className="hh-select">
        <select
          ref={ref}
          id={fieldId}
          className="hh-select__control"
          required={required}
          aria-invalid={error ? true : undefined}
          {...(describedBy ? { 'aria-describedby': describedBy } : {})}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="hh-select__chevron" aria-hidden>
          ▾
        </span>
      </div>
      <Notes {...(help ? { help } : {})} {...(error ? { error } : {})} {...(helpId ? { helpId } : {})} {...(errId ? { errId } : {})} />
    </div>
  );
}

/* ------------------------------------------------------------------------- Checkbox */
export interface CheckboxProps {
  label: ReactElement | string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  className?: string;
}

export function Checkbox(props: CheckboxProps): ReactElement {
  const { label, checked, onChange, required, className } = props;
  const id = useId();
  return (
    <label htmlFor={id} className={cn('hh-checkbox', className)}>
      <input
        id={id}
        type="checkbox"
        className="hh-checkbox__input"
        checked={checked}
        required={required}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="hh-checkbox__box" aria-hidden>
        ✓
      </span>
      <span className="hh-checkbox__label">{label}</span>
    </label>
  );
}
