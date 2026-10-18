import type { ReactElement } from 'react';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';

export function PaymentAdjustmentLine({ amount, currency, definition = false }: { amount?: string | number | null; currency: string; definition?: boolean }): ReactElement | null {
  const { locale } = useLocale();
  const value = Number(amount ?? 0);
  if (!value) return null;
  const Label = definition ? 'dt' : 'span';
  const Value = definition ? 'dd' : 'span';
  const label = value < 0 ? (locale === 'ar' ? 'خصم طريقة الدفع' : 'Payment method discount') : (locale === 'ar' ? 'رسوم طريقة الدفع' : 'Payment method fee');
  return <div className="sf-cart-summary__row" data-payment-adjustment><Label>{label}</Label><Value>{value < 0 ? '−' : '+'}{formatMoney(Math.abs(value), currency, locale)}</Value></div>;
}
