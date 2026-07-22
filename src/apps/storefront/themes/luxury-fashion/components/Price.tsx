/**
 * Price — current / compare-at, in the serif voice. Genuine markdowns show the compare-at struck
 * in `--muted` and the current price in `--sale`; `emphasis` adds the PDP gold glint. Currency is
 * formatted per locale via Intl. No fabricated discounts: a compare-at ≤ current is ignored. §32.3.
 */
import { useMemo, type HTMLAttributes, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface PriceProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Current price, in major currency units (e.g. 149.00). */
  amount: number;
  /** Original price for a markdown; only honoured when strictly greater than `amount`. */
  compareAt?: number;
  /** ISO 4217 currency code (from the store context). */
  currency: string;
  /** BCP-47 locale; defaults to the runtime locale. */
  locale?: string;
  /** PDP emphasis — larger, with the gold accent glint. */
  emphasis?: boolean;
}

export function Price(props: PriceProps): ReactElement {
  const { amount, compareAt, currency, locale, emphasis = false, className, ...rest } = props;

  const format = useMemo(
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
    [locale, currency],
  );

  const onSale = typeof compareAt === 'number' && compareAt > amount;

  return (
    <span
      className={cn('sf-price', onSale && 'sf-price--sale', emphasis && 'sf-price--emphasis', className)}
      {...rest}
    >
      <span className="sf-price__current">{format.format(amount)}</span>
      {onSale ? (
        <span className="sf-price__compare">
          <span className="sr-only">Original price: </span>
          {format.format(compareAt)}
        </span>
      ) : null}
    </span>
  );
}
