/**
 * Checkbox — multi-select / boolean opt-in (filters, T&Cs, newsletter). Sharp 2px box (never round),
 * `--primary` fill + `--on-primary` tick when checked; instant toggle, no bounce. Supports the
 * `indeterminate` parent-filter state (set as a DOM property, not an attribute). See §32.2.
 */
import { useEffect, useId, useMemo, useRef, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { mergeRefs } from '../../../../../shared/utils/mergeRefs';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  /** Renders the tri-state parent-filter dash. */
  indeterminate?: boolean;
  error?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox(props: CheckboxProps): ReactElement {
  const { label, indeterminate = false, error = false, id, className, disabled, ref, ...rest } = props;
  const autoId = useId();
  const boxId = id ?? autoId;
  const innerRef = useRef<HTMLInputElement>(null);
  const setRef = useMemo(() => mergeRefs(innerRef, ref), [ref]);

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      htmlFor={boxId}
      className={cn('sf-choice', 'sf-choice--checkbox', disabled && 'sf-choice--disabled', error && 'sf-choice--error', className)}
    >
      <input id={boxId} ref={setRef} type="checkbox" className="sf-choice__input" disabled={disabled} {...rest} />
      <span className="sf-choice__box" aria-hidden>
        {indeterminate ? (
          <svg className="sf-choice__mark" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="sf-choice__mark" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.2 5 8.6l4.5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label != null ? <span className="sf-choice__label">{label}</span> : null}
    </label>
  );
}
