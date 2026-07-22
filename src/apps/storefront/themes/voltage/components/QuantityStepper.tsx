/** Voltage QuantityStepper — mono tabular field between +/-; clamped. */
import { useId, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface QuantityStepperProps {
  value: number; onChange: (n: number) => void; min?: number; max?: number; disabled?: boolean; label?: string; className?: string;
}
export function QuantityStepper(props: QuantityStepperProps): ReactElement {
  const { value, onChange, min = 1, max = Number.POSITIVE_INFINITY, disabled = false, label = 'Quantity', className } = props;
  const id = useId();
  const set = (n: number): void => { const c = Math.min(max, Math.max(min, n)); if (c !== value && Number.isFinite(c)) onChange(c); };
  return (
    <div className={cn('vlt-qty', className)}>
      <button type="button" className="vlt-qty__btn" aria-label="Decrease quantity" aria-controls={id} disabled={disabled || value <= min} onClick={() => set(value - 1)}>−</button>
      <input id={id} className="vlt-qty__input" type="number" inputMode="numeric" aria-label={label} value={value} min={min} max={Number.isFinite(max) ? max : undefined} disabled={disabled}
        onChange={(e) => { const n = Number.parseInt(e.target.value, 10); if (!Number.isNaN(n)) set(n); }} />
      <button type="button" className="vlt-qty__btn" aria-label="Increase quantity" aria-controls={id} disabled={disabled || value >= max} onClick={() => set(value + 1)}>+</button>
    </div>
  );
}
