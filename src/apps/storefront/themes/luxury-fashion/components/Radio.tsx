/**
 * Radio — one-of-many (payment method, shipping speed). The one truly-round control besides
 * avatars/pills: `--primary` fill + `--on-primary` dot when checked. Wrap a set in a `<fieldset>`
 * with a `<legend>` (RadioGroup) for an accessible group. See §32.2.
 */
import { useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  error?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Radio(props: RadioProps): ReactElement {
  const { label, error = false, id, className, disabled, ref, ...rest } = props;
  const autoId = useId();
  const radioId = id ?? autoId;

  return (
    <label
      htmlFor={radioId}
      className={cn('sf-choice', 'sf-choice--radio', disabled && 'sf-choice--disabled', error && 'sf-choice--error', className)}
    >
      <input id={radioId} ref={ref} type="radio" className="sf-choice__input" disabled={disabled} {...rest} />
      <span className="sf-choice__box" aria-hidden>
        <span className="sf-choice__mark" />
      </span>
      {label != null ? <span className="sf-choice__label">{label}</span> : null}
    </label>
  );
}

export interface RadioGroupProps {
  /** Accessible group name (rendered as the legend). */
  legend: ReactNode;
  /** Visually hide the legend while keeping it for assistive tech. */
  hideLegend?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function RadioGroup(props: RadioGroupProps): ReactElement {
  const { legend, hideLegend = false, error, className, children } = props;
  const autoId = useId();
  const errorId = error ? `${autoId}-error` : undefined;
  return (
    <fieldset
      className={cn('sf-radio-group', className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
    >
      <legend className={cn('sf-radio-group__legend', hideLegend && 'sr-only')}>{legend}</legend>
      <div className="sf-radio-group__options">{children}</div>
      {error ? (
        <p id={errorId} className="sf-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
