export const MANUAL_MAX_CENTS = 999999999999n;

export function manualMoney(value) {
    const raw = String(value ?? '');
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(raw)) return null;
    const [whole, fraction = ''] = raw.split('.');
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
    return cents <= MANUAL_MAX_CENTS ? cents : null;
}

export function manualAmount(cents) {
    const negative = cents < 0n;
    const amount = negative ? -cents : cents;
    return `${negative ? '-' : ''}${amount / 100n}.${String(amount % 100n).padStart(2, '0')}`;
}

export function manualLineKey(productId, variantId) { return `${productId}:${variantId ?? 'base'}`; }

export function manualTotals(lines, shipping, store, override) {
    let subtotal = 0n;
    for (const line of lines) {
        const price = manualMoney(line.unitPrice);
        if (price == null || !/^[1-9]\d{0,2}$/.test(String(line.quantity))) return null;
        subtotal += price * BigInt(line.quantity);
        if (subtotal > MANUAL_MAX_CENTS) return null;
    }
    const delivery = manualMoney(shipping);
    if (delivery == null) return null;
    const rate = String(store?.tax_rate || '0');
    if (!/^\d{1,3}(?:\.\d{1,3})?$/.test(rate)) return null;
    const [whole, fraction = ''] = rate.split('.');
    const milli = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'));
    const tax = store?.tax_enabled ? subtotal * milli / (store.tax_prices_include ? 100000n + milli : 100000n) : 0n;
    const normal = subtotal + delivery + (store?.tax_prices_include ? 0n : tax);
    const total = override == null ? normal : manualMoney(override);
    if (total == null || total > MANUAL_MAX_CENTS || normal > MANUAL_MAX_CENTS) return null;
    return { subtotal: manualAmount(subtotal), shipping: manualAmount(delivery), tax: manualAmount(tax), total: manualAmount(total), adjustment: manualAmount(total - normal) };
}

export function manualPayload(lines, fields, totals, requestKey) {
    if (!totals || !lines.length || lines.length > 100) return null;
    return {
        request_key: requestKey, customer_name: fields.name.trim(), customer_phone: fields.phone.trim(),
        customer_email: fields.email.trim() || null, address: fields.address.trim() || null, notes: fields.notes.trim() || null,
        shipping_total: totals.shipping, ...(fields.totalOverride != null ? { grand_total: totals.total } : {}),
        items: lines.map(line => ({ product_id: line.product.id, variant_id: line.variant?.id ?? null, quantity: Number(line.quantity), expected_price: line.variant?.price ?? line.product.price,
            ...(line.priceEdited ? { unit_price: manualAmount(manualMoney(line.unitPrice)) } : {}), personalization: line.personalization || {} })),
    };
}
