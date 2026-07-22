/**
 * Rouge VariantPicker — a pill row for choosing a product variant (size, format). Selected pill fills
 * rouge; unavailable pills are struck + disabled. For colour/shade variants use ShadeDots instead.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductVariantModel } from '../../../types/catalog';

export interface VariantPickerProps {
  label: string;
  variants: ReadonlyArray<ProductVariantModel>;
  value?: string;
  onChange: (id: string) => void;
  className?: string;
}

export function VariantPicker(props: VariantPickerProps): ReactElement {
  const { label, variants, value, onChange, className } = props;
  return (
    <div className={cn('rge-variants', className)} role="group" aria-label={label}>
      <span className="rge-variants__label">{label}</span>
      <div className="rge-variants__options">
        {variants.map((variant) => (
          <button
            key={variant.id}
            type="button"
            className={cn('rge-variant', variant.id === value && 'rge-variant--selected', !variant.available && 'rge-variant--unavailable')}
            aria-pressed={variant.id === value}
            disabled={!variant.available}
            onClick={() => onChange(variant.id)}
          >
            {variant.label}
          </button>
        ))}
      </div>
    </div>
  );
}
