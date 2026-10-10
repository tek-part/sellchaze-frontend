import type { CheckoutQuote } from '../api/storefront';
import { formatMoney } from '../utils/format';

/** Eligibility comes from live server prices and discounts, never client arithmetic. */
export function minimumOrderAllows(quote: CheckoutQuote | null): boolean {
  return quote !== null && quote.order_minimum?.eligible !== false;
}

export function minimumOrderMessage(quote: CheckoutQuote | null, locale: string): string | undefined {
  const minimum = quote?.order_minimum;
  if (!quote || !minimum || minimum.eligible) return undefined;
  const amount = formatMoney(Number(minimum.amount), quote.currency, locale);
  const remaining = formatMoney(Number(minimum.remaining), quote.currency, locale);
  return locale === 'ar'
    ? `الحد الأدنى للطلب ${amount}. أضف منتجات بقيمة ${remaining} لإكمال الطلب. يُحسب الحد بعد الخصم، بدون الشحن والضريبة.`
    : `Minimum order ${amount}. Add ${remaining} of products to place your order. The minimum uses product value after discounts, excluding shipping and tax.`;
}
