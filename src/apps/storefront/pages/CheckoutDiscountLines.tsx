import type { ReactElement } from 'react';
import type { CheckoutQuote } from '../api/storefront';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { checkoutDiscountLines } from './checkout-discounts';

/** One summary row per applied discount (title or code + amount, or "Free shipping"). */
export function CheckoutDiscountLines({ quote, fallbackLabel, definition = false, className }: {
  quote: Pick<CheckoutQuote, 'discounts' | 'totals' | 'currency'>; fallbackLabel: string; definition?: boolean; className?: string;
}): ReactElement | null {
  const { locale } = useLocale();
  const lines = checkoutDiscountLines(quote, fallbackLabel);
  if (!lines.length) return null;
  const Label = definition ? 'dt' : 'span';
  const Value = definition ? 'dd' : 'span';
  const free = locale === 'ar' ? 'شحن مجاني' : 'Free shipping';
  return <>{lines.map((line) => <div key={line.key} className={className} data-discount-line={line.freeShipping ? 'free-shipping' : 'amount'}>
    <Label>{line.label}</Label>
    <Value>{line.freeShipping ? free : `−${formatMoney(line.amount ?? 0, quote.currency, locale)}`}</Value>
  </div>)}</>;
}
