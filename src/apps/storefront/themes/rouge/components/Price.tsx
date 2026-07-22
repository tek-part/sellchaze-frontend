/**
 * Rouge Price — didone lining figures (boutique feel); compare-at struck in muted; sale in hot-petal.
 * Currency per locale via Intl. No fabricated discounts: compare-at ≤ current is ignored.
 */
import { useMemo, type HTMLAttributes, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface PriceProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  amount: number;
  compareAt?: number;
  currency: string;
  locale?: string;
}

export function Price(props: PriceProps): ReactElement {
  const { amount, compareAt, currency, locale, className, ...rest } = props;
  const format = useMemo(() => new Intl.NumberFormat(locale, { style: 'currency', currency }), [locale, currency]);
  const onSale = typeof compareAt === 'number' && compareAt > amount;
  return (
    <span className={cn('rge-price', 'rge-num', onSale && 'rge-price--sale', className)} {...rest}>
      <span className="rge-price__current">{format.format(amount)}</span>
      {onSale ? (
        <span className="rge-price__compare">
          <span className="sr-only">Was: </span>
          {format.format(compareAt)}
        </span>
      ) : null}
    </span>
  );
}
