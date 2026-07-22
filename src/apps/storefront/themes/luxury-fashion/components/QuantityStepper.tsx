/**
 * QuantityStepper — adjust a line quantity (cart, buy box). Pill with a typable field between the
 * ± controls; − greys at the min bound, + at the max (inventory). Controlled: emits the clamped next
 * value. See §32.2.
 */
import { useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  compact?: boolean;
  /** Accessible name for the quantity field (e.g. the product title). */
  label?: string;
  decrementLabel?: string;
  incrementLabel?: string;
  id?: string;
  className?: string;
  children?: ReactNode;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function QuantityStepper(props: QuantityStepperProps): ReactElement {
  const {
    value,
    onChange,
    min = 1,
    max = Number.POSITIVE_INFINITY,
    step = 1,
    disabled = false,
    compact = false,
    label = 'Quantity',
    decrementLabel = 'Decrease quantity',
    incrementLabel = 'Increase quantity',
    id,
    className,
  } = props;

  const autoId = useId();
  const fieldId = id ?? autoId;
  const atMin = value <= min;
  const atMax = value >= max;

  const set = (next: number): void => {
    const clamped = clamp(next, min, max);
    if (clamped !== value && Number.isFinite(clamped)) onChange(clamped);
  };

  return (
    <div className={cn('sf-qty', compact && 'sf-qty--compact', className)}>
      <button
        type="button"
        className="sf-qty__btn"
        aria-label={decrementLabel}
        aria-controls={fieldId}
        onClick={() => set(value - step)}
        disabled={disabled || atMin}
      >
        <span aria-hidden>−</span>
      </button>
      <input
        id={fieldId}
        className="sf-qty__input"
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        min={min}
        max={Number.isFinite(max) ? max : undefined}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const parsed = Number.parseInt(e.target.value, 10);
          if (!Number.isNaN(parsed)) set(parsed);
        }}
      />
      <button
        type="button"
        className="sf-qty__btn"
        aria-label={incrementLabel}
        aria-controls={fieldId}
        onClick={() => set(value + step)}
        disabled={disabled || atMax}
      >
        <span aria-hidden>+</span>
      </button>
    </div>
  );
}
