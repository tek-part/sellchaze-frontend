import type { CheckoutQuote, PaymentDepositRule, StorefrontPaymentMethod } from '../api/storefront';

/** Methods that cannot collect a deposit now: the remainder is already cash on delivery. */
const UNPAYABLE = ['cod', 'gift_card'];

export function canPayDeposit(method: Pick<StorefrontPaymentMethod, 'slug' | 'deposit_capable'>): boolean {
  return method.deposit_capable !== false && !UNPAYABLE.includes(method.slug);
}

/** The methods offered for this quote: only those that can collect a deposit when one is needed. */
export function depositPaymentMethods<T extends Pick<StorefrontPaymentMethod, 'slug' | 'deposit_capable'>>(methods: ReadonlyArray<T>, quote: Pick<CheckoutQuote, 'deposit'> | null, rule: PaymentDepositRule | null): ReadonlyArray<T> {
  return quote?.deposit || rule ? methods.filter(canPayDeposit) : methods;
}

/** What the shopper confirms on placement: the total, and the deposit on APIs that quote one. */
export function quoteConfirmation(quote: Pick<CheckoutQuote, 'totals' | 'deposit'> | null): { expected_total?: string; expected_deposit?: string } {
  if (!quote) return {};
  return { expected_total: quote.totals.grand_total, ...(quote.deposit !== undefined ? { expected_deposit: quote.deposit?.amount ?? '0.00' } : {}) };
}

export type TextPart = { text: string; href?: undefined } | { text: string; href: string };

/** Split plain text into text and http(s) links; nothing else ever becomes a link. */
export function linkParts(value: string): TextPart[] {
  const parts: TextPart[] = [];
  const pattern = /https?:\/\/[^\s<>"']+/gi;
  let last = 0;
  for (const match of value.matchAll(pattern)) {
    const raw = match[0].replace(/[).,;:!?،؛]+$/u, '');
    const index = match.index ?? 0;
    const href = safeLink(raw);
    if (!href) continue;
    if (index > last) parts.push({ text: value.slice(last, index) });
    parts.push({ text: raw, href });
    last = index + raw.length;
  }
  if (last < value.length) parts.push({ text: value.slice(last) });
  return parts;
}

export function safeLink(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname ? url.href : null;
  } catch {
    return null;
  }
}
