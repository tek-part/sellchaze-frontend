/** Rouge QuantityStepper — didone tabular field between +/- in a soft pill; clamped. */
import { useId, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { IconMinus, IconPlus } from './icons';

export interface QuantityStepperProps {
  value: number; onChange: (n: number) => void; min?: number; max?: number; disabled?: boolean; label?: string; className?: string;
}
export function QuantityStepper(props: QuantityStepperProps): ReactElement {
  const { t } = useTranslation();
  const { value, onChange, min = 1, max = Number.POSITIVE_INFINITY, disabled = false, label = t('product.quantity'), className } = props;
  const id = useId();
  const set = (n: number): void => { const c = Math.min(max, Math.max(min, n)); if (c !== value && Number.isFinite(c)) onChange(c); };
  return (
    <div className={cn('rge-qty', className)}>
      <button type="button" className="rge-qty__btn" aria-label={t('product.decreaseQuantity')} aria-controls={id} disabled={disabled || value <= min} onClick={() => set(value - 1)}>
        <IconMinus width={16} height={16} />
      </button>
      <input id={id} className="rge-qty__input" type="number" inputMode="numeric" aria-label={label} value={value} min={min} max={Number.isFinite(max) ? max : undefined} disabled={disabled}
        onChange={(e) => { const n = Number.parseInt(e.target.value, 10); if (!Number.isNaN(n)) set(n); }} />
      <button type="button" className="rge-qty__btn" aria-label={t('product.increaseQuantity')} aria-controls={id} disabled={disabled || value >= max} onClick={() => set(value + 1)}>
        <IconPlus width={16} height={16} />
      </button>
    </div>
  );
}
