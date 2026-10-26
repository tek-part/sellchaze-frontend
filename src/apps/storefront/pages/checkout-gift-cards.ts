import type { CheckoutQuote } from '../api/storefront';

/** The server accepts at most three gift cards per order. */
export const MAX_GIFT_CARDS = 3;

/** Codes are case- and separator-insensitive: keep letters and digits, upper-cased. */
export function normalizeGiftCardCode(input: string): string {
  return input.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/** A masked chip label: the full code is never shown back. */
export function maskGiftCard(last4: string): string {
  return `•••• ${last4}`;
}

export interface GiftCardLine { key: string; last4: string; amount: number }

/** One summary line per gift card that pays part of the order. */
export function giftCardLines(quote: Pick<CheckoutQuote, 'gift_cards'> | null): GiftCardLine[] {
  return (quote?.gift_cards ?? []).map((card, index) => ({ key: `gift-card-${index}-${card.last4}`, last4: card.last4, amount: Number(card.applied) }))
    .filter((line) => line.amount > 0);
}

/** What the shopper still pays: `amount_due`, or the grand total on an older API. */
export function quoteAmountDue(quote: Pick<CheckoutQuote, 'amount_due' | 'totals'>): number {
  return Number(quote.amount_due ?? quote.totals.grand_total);
}

/** True when applied gift cards pay the whole order, so no payment method is needed. */
export function giftCardsCoverTotal(quote: Pick<CheckoutQuote, 'amount_due' | 'totals' | 'gift_cards'> | null, codes: ReadonlyArray<string>): boolean {
  return Boolean(quote && codes.length > 0 && quote.amount_due !== undefined && giftCardLines(quote).length > 0 && quoteAmountDue(quote) <= 0);
}
