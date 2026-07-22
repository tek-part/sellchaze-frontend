/**
 * Switch — immediate on/off setting (gift wrap, marketing consent). Pill track, knob glides on
 * `--transition`. Use ONLY when the change applies instantly; otherwise use Checkbox. Exposes the
 * native `role="switch"` semantics. See §32.2.
 */
import { useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Switch(props: SwitchProps): ReactElement {
  const { label, id, className, disabled, ref, ...rest } = props;
  const autoId = useId();
  const switchId = id ?? autoId;

  return (
    <label htmlFor={switchId} className={cn('sf-switch', disabled && 'sf-switch--disabled', className)}>
      <input
        id={switchId}
        ref={ref}
        type="checkbox"
        role="switch"
        className="sf-switch__input"
        disabled={disabled}
        {...rest}
      />
      <span className="sf-switch__track" aria-hidden>
        <span className="sf-switch__knob" />
      </span>
      {label != null ? <span className="sf-switch__label">{label}</span> : null}
    </label>
  );
}
