/**
 * Price — money display in the soft sans with tabular figures (Hearth sets data in the sans, not
 * mono — that is Theme 02's signature). Sale-aware: current + struck original + a screen-reader
 * summary. Formats with Intl for the store currency/locale.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface PriceProps {
  value: number;
  /** Original price when marked down (rendered struck when > value). */
  compareAt?: number;
  currency: string;
  size?: 'sm' | 'base' | 'lg';
  className?: string;
}

function format(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function Price(props: PriceProps): ReactElement {
  const { value, compareAt, currency, size = 'base', className } = props;
  const onSale = typeof compareAt === 'number' && compareAt > value;
  const current = format(value, currency);

  return (
    <span className={cn('hh-price', `hh-price--${size}`, onSale && 'hh-price--sale', className)}>
      {onSale ? (
        <>
          <span className="hh-price__current">{current}</span>
          <s className="hh-price__was">{format(compareAt, currency)}</s>
          <span className="hh-visually-hidden">
            Sale price {current}, was {format(compareAt, currency)}
          </span>
        </>
      ) : (
        <span className="hh-price__current">{current}</span>
      )}
    </span>
  );
}
