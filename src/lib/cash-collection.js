function decimal(value) {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(2, '0')}`;
}

// Compare decimal strings without floating-point rounding of a collection amount.
export function cashCollectionRequest(order, reference, amount, collected, note = '') {
    const normalized = decimal(amount);
    const ref = reference.trim();
    if (order.payment_method !== 'cod' || !['pending', 'unpaid'].includes(order.payment_status)
        || order.status === 'cancelled' || !collected || !ref || ref.length > 200 || note.length > 2000
        || !normalized || normalized !== decimal(order.grand_total) || !/^[A-Za-z]{3}$/.test(order.currency || '')) return null;
    return { reference: ref, amount: normalized, currency: order.currency.toUpperCase(), collected: true, note: note.trim() || null };
}
