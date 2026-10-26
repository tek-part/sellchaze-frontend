// G1 (TAR-036): deposits paid online with the remainder collected on delivery, payment method changes
// and transfer targets. Decimal strings are compared without floating-point rounding.

function decimal(value) {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(2, '0')}`;
}

const CLOSED = ['cancelled', 'returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded'];

/** The order's deposit as the API reports it, or null for an order without one (older APIs too). */
export function orderDeposit(order) {
    const deposit = order?.deposit;
    return deposit && typeof deposit === 'object' && decimal(deposit.amount) ? deposit : null;
}

/**
 * How the order is paid, for the invoice and the payment card: cash on delivery for everything,
 * "paid X, Y on delivery" for a paid deposit, "pay X now, Y on delivery" for a pending one, or paid in full.
 */
export function paymentSplit(order) {
    const deposit = orderDeposit(order);
    const due = order?.amount_due ?? order?.grand_total ?? '0.00';
    if (order?.payment_status === 'paid' || order?.payment_status === 'refunded' || order?.payment_status === 'partially_refunded') return { kind: 'paid', paid: due, remaining: '0.00' };
    if (deposit) return deposit.paid ? { kind: 'deposit_paid', paid: deposit.amount, remaining: deposit.remainder_collected ? '0.00' : deposit.remaining } : { kind: 'deposit_due', paid: '0.00', due: deposit.amount, remaining: deposit.remaining };
    return order?.payment_method === 'cod' ? { kind: 'cod', paid: '0.00', remaining: due } : { kind: 'unpaid', paid: '0.00', remaining: due };
}

/** A remainder collection request, or null until the reference, the exact remaining amount and the acknowledgement are given. */
export function remainderCollectionRequest(order, reference, amount, collected, note = '') {
    const deposit = orderDeposit(order);
    const normalized = decimal(amount);
    const ref = reference.trim();
    if (!deposit || !deposit.paid || deposit.remainder_collected || !['deposit_paid', 'partially_refunded'].includes(order.payment_status) || CLOSED.includes(order.status)
        || !collected || !ref || ref.length > 200 || note.length > 2000 || !normalized || normalized !== decimal(deposit.remaining) || Number(normalized) <= 0
        || !/^[A-Za-z]{3}$/.test(order.currency || '')) return null;
    return { reference: ref, amount: normalized, currency: order.currency.toUpperCase(), collected: true, note: note.trim() || null };
}

/** Whether the merchant may move the order to another payment method (the server decides the final word). */
export function paymentMethodChangeable(order) {
    return Boolean(order) && !order.archived_at && ['pending', 'confirmed', 'processing'].includes(order.status) && ['pending', 'failed'].includes(order.payment_status)
        && !orderDeposit(order)?.paid;
}

/** The deposit settings payload, or an error key the form shows. */
export function depositSettingsPayload(draft) {
    const percentage = decimal(draft.percentage);
    const minimum = decimal(draft.minimum);
    if (percentage === null || Number(percentage) > 100) return { error: 'percentage' };
    if (minimum === null || Number(minimum) > 9999999999.99) return { error: 'minimum' };
    if (draft.enabled && Number(percentage) === 0 && Number(minimum) === 0) return { error: 'empty' };
    if (!['all', 'flagged'].includes(draft.scope)) return { error: 'scope' };
    return { payload: { enabled: Boolean(draft.enabled), percentage, minimum, scope: draft.scope, confirm_after_payment: Boolean(draft.confirm_after_payment), version: Number(draft.version) || 1 } };
}

/** An absolute http(s) URL, or null: anything else is never rendered as a link. */
export function safeHttpUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
        const url = new URL(value.trim());
        return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname ? url.href : null;
    } catch {
        return null;
    }
}

export const TRANSFER_TARGET_LIMIT = 2;

/** Transfer targets ready to save: trimmed, complete rows only, at most two; an unsafe link is an error. */
export function transferTargetsPayload(targets) {
    const rows = [];
    for (const target of targets ?? []) {
        const label = String(target?.label ?? '').trim();
        const number = String(target?.number ?? '').trim();
        const link = String(target?.link ?? '').trim();
        if (!label && !number && !link) continue;
        if (!label || !number) return { error: 'incomplete' };
        if (link && !safeHttpUrl(link)) return { error: 'link' };
        rows.push({ label, number, link: link || null });
    }
    return rows.length > TRANSFER_TARGET_LIMIT ? { error: 'limit' } : { targets: rows };
}
