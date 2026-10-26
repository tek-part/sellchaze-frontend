import { useEffect, useState, type ReactElement } from 'react';
import type { CheckoutQuote, PaymentDepositRule, StorefrontPaymentMethod, TransferTarget } from '../api/storefront';
import { useLocale } from '../i18n/useLocale';
import { formatMoney } from '../utils/format';
import { depositPaymentMethods, linkParts, safeLink } from './checkout-deposit';

/**
 * G1: the methods offered for a quote that needs a deposit, switching the selection to one that can
 * collect it (the shopper never submits cash on delivery for a deposit order).
 */
export function useDepositPaymentMethods(flow: { paymentMethods: ReadonlyArray<StorefrontPaymentMethod>; depositRule: PaymentDepositRule | null; paymentMethod: string; setPaymentMethod: (slug: string) => void },
  quote: Pick<CheckoutQuote, 'deposit'> | null): ReadonlyArray<StorefrontPaymentMethod> {
  const methods = depositPaymentMethods(flow.paymentMethods, quote, flow.depositRule);
  const { paymentMethod, setPaymentMethod } = flow;
  const first = methods[0]?.slug;
  const offered = methods.some((method) => method.slug === paymentMethod);
  useEffect(() => {
    if (!offered && first) setPaymentMethod(first);
  }, [offered, first, setPaymentMethod]);
  return methods;
}

/** Plain text with its http(s) links clickable (opened safely in a new tab). */
export function LinkedText({ value }: { value: string }): ReactElement {
  return <>{linkParts(value).map((part, index) => part.href
    ? <a key={index} href={part.href} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">{part.text}</a>
    : <span key={index}>{part.text}</span>)}</>;
}

function CopyButton({ value, label }: { value: string; label: string }): ReactElement {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable: the number stays selectable */ }
  };
  return <button type="button" className="sf-transfer-target__copy" onClick={() => void copy()} aria-label={ar ? `نسخ ${label}` : `Copy ${label}`}>
    <span aria-live="polite">{copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}</span>
  </button>;
}

/** A transfer method's targets: number with a copy button, and an optional http(s) link (e.g. InstaPay). */
export function TransferTargets({ targets }: { targets: ReadonlyArray<TransferTarget> | undefined }): ReactElement | null {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  if (!targets?.length) return null;
  return <ul className="sf-transfer-targets" aria-label={ar ? 'بيانات التحويل' : 'Transfer details'}>
    {targets.map((target, index) => {
      const link = safeLink(target.link);
      return <li key={`${target.label}-${index}`} className="sf-transfer-target">
        <span className="sf-transfer-target__label">{target.label}</span>
        <span className="sf-transfer-target__row"><bdi dir="ltr" className="sf-transfer-target__number">{target.number}</bdi><CopyButton value={target.number} label={target.label} /></span>
        {link ? <a className="sf-transfer-target__link" href={link} target="_blank" rel="noopener noreferrer nofollow">{ar ? `الدفع عبر ${target.label}` : `Pay with ${target.label}`}</a> : null}
      </li>;
    })}
  </ul>;
}

/** The selected method's description (links clickable) and transfer targets. */
export function PaymentMethodDetail({ method, className }: { method: Pick<StorefrontPaymentMethod, 'description' | 'transfer_targets'>; className?: string }): ReactElement | null {
  if (!method.description && !method.transfer_targets?.length) return null;
  return <div className={className}>
    {method.description ? <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}><LinkedText value={method.description} /></p> : null}
    <TransferTargets targets={method.transfer_targets} />
  </div>;
}

/** "Pay now X · on delivery Y" for a quote with a deposit. */
export function DepositNote({ quote }: { quote: Pick<CheckoutQuote, 'deposit' | 'currency'> | null }): ReactElement | null {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const deposit = quote?.deposit;
  if (!quote || !deposit) return null;
  const money = (value: string): string => formatMoney(Number(value), quote.currency, locale);
  return <p className="sf-co-deposit-note" role="status" data-deposit-note>
    {Number(deposit.remaining) > 0
      ? (ar ? `هذا الطلب يتطلب عربونًا: ادفع ${money(deposit.amount)} الآن، والباقي ${money(deposit.remaining)} عند الاستلام.` : `This order needs a deposit: pay ${money(deposit.amount)} now and the remaining ${money(deposit.remaining)} on delivery.`)
      : (ar ? `هذا الطلب يُدفع مقدمًا بالكامل: ${money(deposit.amount)}.` : `This order is paid in full in advance: ${money(deposit.amount)}.`)}
    {deposit.confirm_after_payment ? (ar ? ' يُؤكَّد الطلب بعد دفع العربون.' : ' The order is confirmed once the deposit is paid.') : ''}
  </p>;
}
