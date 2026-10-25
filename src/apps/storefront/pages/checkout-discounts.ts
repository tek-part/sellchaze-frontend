import type { CheckoutQuote } from '../api/storefront';

export interface CheckoutDiscountLine {
  key: string;
  label: string;
  /** Amount taken off the order; null for a free-shipping discount. */
  amount: number | null;
  freeShipping: boolean;
}

/**
 * The summary lines for a quote's discounts: one per applied discount, by title (or code). An
 * older API without `discounts` keeps the single generic line for `discount_total`.
 */
export function checkoutDiscountLines(quote: Pick<CheckoutQuote, 'discounts' | 'totals'>, fallbackLabel: string): CheckoutDiscountLine[] {
  const total = Number(quote.totals.discount_total);
  const generic: CheckoutDiscountLine = { key: 'discount', label: fallbackLabel, amount: total, freeShipping: false };
  if (!Array.isArray(quote.discounts)) return total > 0 ? [generic] : [];
  const lines: CheckoutDiscountLine[] = [];
  for (const discount of quote.discounts) {
    const label = discount.title?.trim() || discount.code?.trim() || fallbackLabel;
    if (discount.type === 'free_shipping') lines.push({ key: `discount-${discount.id}`, label, amount: null, freeShipping: true });
    else if (Number(discount.amount) > 0) lines.push({ key: `discount-${discount.id}`, label, amount: Number(discount.amount), freeShipping: false });
  }
  if (total > 0 && !lines.some((line) => !line.freeShipping)) lines.unshift(generic);
  return lines;
}

/** True when a free-shipping discount applied to the quote. */
export function quoteHasFreeShippingDiscount(quote: Pick<CheckoutQuote, 'discounts'> | null): boolean {
  return Boolean(quote?.discounts?.some((discount) => discount.type === 'free_shipping'));
}
