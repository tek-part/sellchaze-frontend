/**
 * VariantPicker — finish / material / colour swatches for the PDP. A labelled radiogroup: each
 * swatch carries its material/colour name (never colour-only), selection shows a terracotta ring,
 * and unavailable options are marked and non-selectable. Binds the shared `ProductSwatch[]`; renders
 * nothing when a product has no finishes (data-gap safe).
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductSwatch } from '../../../types/catalog';

export interface VariantPickerProps {
  label: string;
  options: ReadonlyArray<ProductSwatch>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function VariantPicker(props: VariantPickerProps): ReactElement | null {
  const { label, options, value, onChange, className } = props;
  if (options.length === 0) return null;
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn('hh-variant', className)}>
      <div className="hh-variant__head">
        <span className="hh-variant__label">{label}</span>
        {selected ? <span className="hh-variant__value">{selected.label}</span> : null}
      </div>
      <div className="hh-variant__options" role="radiogroup" aria-label={label}>
        {options.map((o) => {
          const available = o.available !== false;
          const isSelected = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${o.label}${available ? '' : ' (unavailable)'}`}
              disabled={!available}
              className={cn(
                'hh-variant__swatch',
                isSelected && 'hh-variant__swatch--selected',
                !available && 'hh-variant__swatch--unavailable',
              )}
              style={{ background: o.color }}
              onClick={() => available && onChange(o.value)}
            >
              <span className="hh-visually-hidden">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
