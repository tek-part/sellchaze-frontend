/** Gift cards: a stored-value tender. The full code exists only in the issue response. */
export type GiftCardState = 'active' | 'disabled' | 'expired' | 'depleted';
export type GiftCardReason = 'issued' | 'redeemed' | 'restored' | 'adjusted';

export const GIFT_CARD_STATES: GiftCardState[] = ['active', 'disabled', 'expired', 'depleted'];

const STATE_LABELS: Record<GiftCardState, [string, string]> = {
  active: ['فعالة', 'Active'], disabled: ['معطلة', 'Disabled'], expired: ['منتهية', 'Expired'], depleted: ['مستنفدة', 'Used up'],
};
const REASON_LABELS: Record<GiftCardReason, [string, string]> = {
  issued: ['إصدار', 'Issued'], redeemed: ['استخدام في طلب', 'Used on order'], restored: ['استرجاع من طلب', 'Restored from order'], adjusted: ['تعديل يدوي', 'Manual adjustment'],
};

export function giftCardStateLabel(state: string, ar: boolean): string {
  const pair = STATE_LABELS[state as GiftCardState];
  return pair ? pair[ar ? 0 : 1] : state;
}

/** Badge tone for the shared index table. */
export function giftCardStateTone(state: string): string {
  return state === 'active' ? 'is-success' : state === 'expired' ? 'is-warning' : '';
}

export function giftCardReasonLabel(reason: string, ar: boolean): string {
  const pair = REASON_LABELS[reason as GiftCardReason];
  return pair ? pair[ar ? 0 : 1] : reason;
}

export function maskGiftCardCode(last4: string): string {
  return `•••• ${last4}`;
}

export interface GiftCardIssueForm { initial_value: string; expires_at: string; customer_name: string; customer_email: string; customer_phone: string; note: string }

export const emptyGiftCardForm = (): GiftCardIssueForm => ({ initial_value: '', expires_at: '', customer_name: '', customer_email: '', customer_phone: '', note: '' });

/** Trimmed issue body; blank optional fields are sent as null. */
export function giftCardIssuePayload(form: GiftCardIssueForm): Record<string, string | null> {
  const optional = (value: string): string | null => value.trim() || null;
  return {
    initial_value: form.initial_value.trim(),
    expires_at: optional(form.expires_at),
    customer_name: optional(form.customer_name),
    customer_email: optional(form.customer_email),
    customer_phone: optional(form.customer_phone),
    note: optional(form.note),
  };
}

/** A signed balance correction: "add" or "remove" an amount, with the reason the ledger keeps. */
export function giftCardAdjustPayload(direction: 'add' | 'remove', amount: string, reason: string): { amount: string; reason: string } | null {
  const value = amount.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(value) || Number(value) <= 0 || !reason.trim()) return null;
  return { amount: direction === 'remove' ? `-${value}` : value, reason: reason.trim() };
}
