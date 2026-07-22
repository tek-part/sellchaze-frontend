/**
 * Variant selection — ColorSwatches (round hairline chips), SizeSelector (sharp square tiles) and
 * a VariantGroup label wrapper. Single-select radiogroup semantics, fully keyboard-navigable.
 * Unavailable options stay visible (struck), never hidden. See §32.2.
 */
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface VariantGroupProps {
  /** e.g. "Colour", "Size". */
  label: string;
  /** The currently-selected option's display label, shown beside the group label. */
  value?: string;
  children: ReactNode;
  className?: string;
}

export function VariantGroup(props: VariantGroupProps): ReactElement {
  const { label, value, children, className } = props;
  return (
    <div className={cn('sf-variant-group', className)}>
      <div className="sf-variant-group__head">
        <span className="sf-field__label sf-field__label--static">{label}</span>
        {value ? <span className="sf-variant-group__value">{value}</span> : null}
      </div>
      {children}
    </div>
  );
}

export interface ColorOption {
  value: string;
  label: string;
  /** CSS colour (hex, or a gradient for multi-colour swatches). */
  color: string;
  available?: boolean;
}

export interface ColorSwatchesProps {
  options: ReadonlyArray<ColorOption>;
  value?: string;
  onChange: (value: string) => void;
  /** Accessible group name. */
  label: string;
  className?: string;
}

export function ColorSwatches(props: ColorSwatchesProps): ReactElement {
  const { options, value, onChange, label, className } = props;
  return (
    <div className={cn('sf-swatches', className)} role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const unavailable = opt.available === false;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={unavailable ? `${opt.label} (unavailable)` : opt.label}
            title={opt.label}
            disabled={unavailable}
            className={cn('sf-swatch', selected && 'sf-swatch--selected', unavailable && 'sf-swatch--unavailable')}
            style={{ '--sf-swatch-color': opt.color } as CSSProperties}
            onClick={() => onChange(opt.value)}
          >
            <span className="sf-swatch__fill" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

export interface SizeOption {
  value: string;
  label: string;
  available?: boolean;
}

export interface SizeSelectorProps {
  options: ReadonlyArray<SizeOption>;
  value?: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export function SizeSelector(props: SizeSelectorProps): ReactElement {
  const { options, value, onChange, label, className } = props;
  return (
    <div className={cn('sf-sizes', className)} role="radiogroup" aria-label={label}>
      {options.map((opt) => {
        const selected = opt.value === value;
        const unavailable = opt.available === false;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={unavailable ? `${opt.label} (unavailable)` : opt.label}
            disabled={unavailable}
            className={cn('sf-size', selected && 'sf-size--selected', unavailable && 'sf-size--unavailable')}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
