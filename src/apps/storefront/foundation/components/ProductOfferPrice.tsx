import type { ReactElement } from 'react';
import { useLocale } from '../../i18n/useLocale';

function Amount({ amount, currency }: { amount: number; currency: string }): ReactElement {
  const { locale } = useLocale();
  const parts = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { style: 'currency', currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).formatToParts(amount);
  return <><span className="sf-offer-price__number">{parts.filter((part) => part.type !== 'currency').map((part) => part.value).join('').trim()}</span><span className="sf-offer-price__currency">{parts.find((part) => part.type === 'currency')?.value}</span></>;
}

export function ProductOfferPrice({ amount, compareAt, currency }: { amount: number; compareAt?: number; currency: string }): ReactElement {
  return <div className="sf-offer-price"><span className="sf-offer-price__current"><Amount amount={amount} currency={currency} /></span>{compareAt !== undefined && compareAt > amount ? <del className="sf-offer-price__compare"><Amount amount={compareAt} currency={currency} /></del> : null}</div>;
}
