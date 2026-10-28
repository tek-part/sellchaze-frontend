import type { ReactElement } from 'react';
import type { StorefrontPaymentMethod } from '../api/storefront';

/** Applies to what this method collects after discounts, shipping, fees and gift cards. */
export function PaymentAmountLimitHint({ method, locale }: { method: StorefrontPaymentMethod; locale: string }): ReactElement | null {
  const limits = method.amount_limits;
  if (!limits || !/^[A-Z]{3}$/.test(limits.currency) || !/^\d{1,10}(?:\.\d{1,3})?$/.test(limits.minimum)
    || (limits.maximum !== null && (!/^\d{1,10}(?:\.\d{1,3})?$/.test(limits.maximum) || Number(limits.maximum) < Number(limits.minimum)))) return null;
  const ar = locale.startsWith('ar');
  return <small data-payment-amount-limits style={{ display: 'block' }}>
    {ar ? 'المبلغ المدفوع بهذه الطريقة: من ' : 'Amount collected by this method: at least '}
    <bdi>{limits.minimum} {limits.currency}</bdi>
    {limits.maximum !== null ? <>{ar ? ' إلى ' : ', up to '}<bdi>{limits.maximum} {limits.currency}</bdi></> : null}
    .
  </small>;
}
