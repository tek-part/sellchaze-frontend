/**
 * QuantityStepper — accessible − / value / + control. Clamps to [min, max]; announces the new
 * quantity via a live region. Furniture is often qty 1, but small goods vary.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}

export function QuantityStepper(props: QuantityStepperProps): ReactElement {
  const { t } = useTranslation();
  const { value, onChange, min = 1, max = 99, label = t('product.quantity'), className } = props;
  const dec = (): void => onChange(Math.max(min, value - 1));
  const inc = (): void => onChange(Math.min(max, value + 1));

  return (
    <div className={cn('hh-qty', className)} role="group" aria-label={label}>
      <button type="button" className="hh-qty__btn" onClick={dec} disabled={value <= min} aria-label={t('product.decreaseQuantity')}>
        −
      </button>
      <span className="hh-qty__value" aria-live="polite">
        {value}
      </span>
      <button type="button" className="hh-qty__btn" onClick={inc} disabled={value >= max} aria-label={t('product.increaseQuantity')}>
        +
      </button>
    </div>
  );
}
