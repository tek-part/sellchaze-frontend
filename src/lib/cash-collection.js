function decimal(value) {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(2, '0')}`;
}

/** What the customer still pays: the order total less gift cards (older APIs: the total). */
export function orderAmountDue(order) {
    return order.amount_due ?? order.grand_total;
}

// Compare decimal strings without floating-point rounding of a collection amount.
export function cashCollectionRequest(order, reference, amount, collected, note = '') {
    const normalized = decimal(amount);
    const ref = reference.trim();
    if (order.payment_method !== 'cod' || !['pending', 'unpaid'].includes(order.payment_status)
        || ['cancelled', 'returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded'].includes(order.status) || !collected || !ref || ref.length > 200 || note.length > 2000
        || !normalized || normalized !== decimal(orderAmountDue(order)) || !/^[A-Za-z]{3}$/.test(order.currency || '')) return null;
    return { reference: ref, amount: normalized, currency: order.currency.toUpperCase(), collected: true, note: note.trim() || null };
}
