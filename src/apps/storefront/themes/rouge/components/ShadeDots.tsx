/**
 * Rouge ShadeDots — the theme's signature cosmetic control: a row of circular shade swatches. The
 * selected shade grows a double ring (rouge on bg). Beauty-first merchandising; reads the shared
 * ProductSwatch view-model. `readOnly` renders a compact preview (product cards); interactive mode
 * (PDP) fires `onSelect`.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductSwatch } from '../../../types/catalog';

export interface ShadeDotsProps {
  shades: ReadonlyArray<ProductSwatch>;
  selected?: string;
  onSelect?: (value: string) => void;
  /** Compact, non-interactive preview (product cards). */
  readOnly?: boolean;
  large?: boolean;
  /** Cap the number shown; overflow renders a "+N" hint (readOnly only). */
  max?: number;
  className?: string;
}

export function ShadeDots(props: ShadeDotsProps): ReactElement | null {
  const { shades, selected, onSelect, readOnly = false, large = false, max, className } = props;
  if (!shades.length) return null;
  const shown = readOnly && typeof max === 'number' ? shades.slice(0, max) : shades;
  const overflow = shades.length - shown.length;

  return (
    <div className={cn('rge-shades', className)} role={readOnly ? undefined : 'group'} aria-label={readOnly ? undefined : 'Choose a shade'}>
      {shown.map((shade) => {
        const isSelected = shade.value === selected;
        const style = { background: shade.color } as const;
        if (readOnly) {
          return <span key={shade.value} className={cn('rge-shade', large && 'rge-shade--lg')} style={style} aria-hidden />;
        }
        return (
          <button
            key={shade.value}
            type="button"
            className={cn('rge-shade', large && 'rge-shade--lg')}
            style={style}
            aria-pressed={isSelected}
            aria-label={shade.label + (shade.available === false ? ' (out of stock)' : '')}
            title={shade.label}
            disabled={shade.available === false}
            onClick={() => onSelect?.(shade.value)}
          />
        );
      })}
      {readOnly && overflow > 0 ? <span className="rge-shades__more rge-num">+{overflow}</span> : null}
    </div>
  );
}
