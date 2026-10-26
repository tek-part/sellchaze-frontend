import { refundValueAvailable } from '../../../lib/gift-card-refunds';

// Refund and return vocabulary shared by the order detail page and the Returns list.
// Labels are [ar, en] pairs, like the rest of the orders workspace.

export const REFUND_METHODS = [
    ['original_payment', 'طريقة الدفع الأصلية', 'Original payment method'],
    ['cash', 'نقدًا', 'Cash'],
    ['bank_transfer', 'تحويل بنكي', 'Bank transfer'],
    ['store_credit', 'رصيد في المتجر', 'Store credit note'],
];

export const REFUND_REASONS = [
    ['customer_request', 'طلب العميل', 'Customer request'],
    ['returned', 'إرجاع المنتجات', 'Items returned'],
    ['damaged', 'منتج تالف', 'Damaged item'],
    ['wrong_item', 'منتج خاطئ', 'Wrong item'],
    ['not_delivered', 'لم يُسلَّم الطلب', 'Not delivered'],
    ['order_cancelled', 'الطلب ملغي', 'Order cancelled'],
    ['other', 'سبب آخر', 'Other'],
];

export const RETURN_STATUSES = [
    ['requested', 'بانتظار المراجعة', 'Requested'],
    ['approved', 'مقبول', 'Approved'],
    ['received', 'تم الاستلام', 'Received'],
    ['closed', 'مغلق', 'Closed'],
    ['rejected', 'مرفوض', 'Rejected'],
];

export const RETURN_REASONS = [
    ['damaged', 'منتج تالف', 'Damaged item'],
    ['wrong_item', 'منتج خاطئ', 'Wrong item'],
    ['not_as_described', 'غير مطابق للوصف', 'Not as described'],
    ['size_fit', 'المقاس غير مناسب', 'Size or fit'],
    ['changed_mind', 'غيّر رأيه', 'Changed mind'],
    ['other', 'سبب آخر', 'Other'],
];

export const RETURN_RESOLUTIONS = [
    ['refund', 'استرداد المبلغ', 'Refund'],
    ['exchange', 'استبدال', 'Exchange'],
    ['store_credit', 'رصيد في المتجر', 'Store credit'],
];

export const PAYMENT_STATUS_LABELS = {
    pending: ['في انتظار الدفع', 'Awaiting payment'],
    deposit_paid: ['تم دفع العربون', 'Deposit paid'],
    paid: ['تم الدفع', 'Paid'],
    failed: ['فشل الدفع', 'Payment failed'],
    partially_refunded: ['مسترد جزئيًا', 'Partially refunded'],
    refunded: ['مسترد', 'Refunded'],
};

export const RETURN_STATUS_TONES = { requested: 'is-warning', approved: 'is-info', received: 'is-info', closed: 'is-success', rejected: 'is-critical' };

export function vocabularyLabel(list, value, ar) {
    const row = list.find(([key]) => key === value);
    return row ? row[ar ? 1 : 2] : (value ?? '');
}

export function paymentStatusLabel(value, ar) {
    return PAYMENT_STATUS_LABELS[value]?.[ar ? 0 : 1] ?? value ?? '';
}

/** "12.34" → 1234. Money is kept in integer cents so totals match the server to the cent. */
export function toCents(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 100) : 0;
}

export function fromCents(cents) {
    return (Math.max(0, cents) / 100).toFixed(2);
}

/**
 * Cents the server will refund for `quantity` more units of a line (mirrors StoreOrderRefunds):
 * the proportional share of the line's allocation, and exactly what is left for the last units.
 */
export function lineRefundCents(line, quantity) {
    const units = Math.max(0, Math.min(Number(quantity) || 0, line.refundable_quantity));
    if (units === 0) return 0;
    const remaining = toCents(line.refundable_amount);
    if (units >= line.refundable_quantity) return remaining;
    const share = Number((BigInt(toCents(line.allocated_amount)) * BigInt(units)) / BigInt(Math.max(1, line.quantity)));
    return Math.min(share, remaining);
}

/** Computed refund (items + shipping) and the ceiling the merchant may type, both in cents. */
export function refundTotals(summary, quantities, shippingAmount) {
    if (!summary) return { items: 0, shipping: 0, computed: 0, max: 0 };
    // Collected money, or gift card value not yet returned (cash on delivery returned undelivered).
    const collected = refundValueAvailable(summary);
    const items = collected ? (summary.items || []).reduce((sum, line) => sum + lineRefundCents(line, quantities[line.store_order_item_id] || 0), 0) : 0;
    const shipping = collected ? Math.min(toCents(shippingAmount), toCents(summary.shipping?.refundable)) : 0;
    const computed = items + shipping;
    return { items, shipping, computed, max: Math.min(computed, toCents(summary.refundable_total)) };
}

/** Which units of a partly shipped line a refund is about first (mirrors StoreInventory::refundUnits). */
export const REFUND_UNITS = [
    ['unshipped', 'لم تُشحن بعد (إلغاء الحجز)', 'Not shipped yet (release the hold)'],
    ['shipped', 'مشحونة ومرتجعة', 'Shipped and returned'],
];

/** The line offers a choice only when it has both shipped and unshipped units left to refund. */
export const refundUnitsChoice = (line) => (line.shipped_refundable_quantity ?? 0) > 0 && (line.unshipped_refundable_quantity ?? 0) > 0;

/**
 * Inventory effect of refunding `quantity` units of a line: units released (never shipped) and units
 * returned (shipped, restockable). Lines from servers without the bucket fields count as shipped.
 */
export function refundUnitSplit(line, quantity, units = 'unshipped') {
    const count = Math.max(0, Math.trunc(Number(quantity) || 0));
    const shipped = Math.max(0, line.shipped_refundable_quantity ?? (line.restockable ? line.refundable_quantity : 0));
    const unshipped = Math.max(0, line.unshipped_refundable_quantity ?? 0);
    if (units === 'shipped') {
        const returned = Math.min(count, shipped);
        return { returned, released: Math.min(count - returned, unshipped) };
    }
    const released = Math.min(count, unshipped);
    return { released, returned: Math.min(count - released, shipped) };
}

/** Units that can go back on the shelf for the chosen quantities. */
export function restockableUnits(summary, quantities, unitChoices = {}, defaultUnits = 'unshipped') {
    return (summary?.items || []).filter((line) => line.restockable).reduce((sum, line) => sum
        + refundUnitSplit(line, quantities[line.store_order_item_id] || 0, unitChoices[line.store_order_item_id] || defaultUnits).returned, 0);
}
