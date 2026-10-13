import { MANUAL_MAX_CENTS, manualAmount, manualMoney } from './manual-order';

export function orderEditLines(order) {
    return (order.items || []).map(item => ({ key: `item:${item.id}`, itemId: item.id,
        product: { id: item.store_product_id, name: item.name, price: item.unit_price, digital_type: item.digital_delivery?.type || 'physical' },
        variant: item.variant_id ? { id: item.variant_id, name: item.variant_name, options: item.variant_options } : null,
        unitPrice: item.unit_price, quantity: String(item.quantity), priceEdited: false, snapshotPersonalization: item.personalization, personalization: {} }));
}

export function orderEditChanged(lines, shipping, override, original) {
    const old = new Map((original.items || []).map(item => [item.id, item]));
    return override != null || lines.length !== old.size || manualMoney(shipping) !== manualMoney(original.shipping_total)
        || lines.some(line => !old.has(line.itemId) || Number(line.quantity) !== old.get(line.itemId).quantity || manualMoney(line.unitPrice) !== manualMoney(old.get(line.itemId).unit_price));
}

export function orderEditTotals(lines, shipping, pricing, original, override = null) {
    if (manualMoney(shipping) == null || lines.some(line => manualMoney(line.unitPrice) == null || !/^[1-9]\d{0,2}$/.test(String(line.quantity)))) return null;
    if (!orderEditChanged(lines, shipping, override, original)) return { subtotal: original.subtotal, discount: original.discount_total, shipping: original.shipping_total,
        tax: original.tax_total, total: original.grand_total, adjustment: original.manual_adjustment_total || '0.00', included: original.manual_tax_included };
    let subtotal = 0n;
    for (const line of lines) {
        const price = manualMoney(line.unitPrice);
        if (price == null || !/^[1-9]\d{0,2}$/.test(String(line.quantity))) return null;
        subtotal += price * BigInt(line.quantity);
        if (subtotal > MANUAL_MAX_CENTS) return null;
    }
    const delivery = manualMoney(shipping); const savedDiscount = manualMoney(original.discount_total || '0');
    if (delivery == null || savedDiscount == null) return null;
    const discount = savedDiscount > subtotal ? subtotal : savedDiscount; const taxable = subtotal - discount;
    const rate = String(pricing?.tax_rate || '0'); if (!/^\d{1,3}(?:\.\d{1,3})?$/.test(rate)) return null;
    const [whole, fraction = ''] = rate.split('.'); const milli = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'));
    const tax = pricing?.tax_enabled ? taxable * milli / (pricing.tax_prices_include ? 100000n + milli : 100000n) : 0n;
    const normal = taxable + delivery + (pricing?.tax_prices_include ? 0n : tax);
    const adjustmentRaw = String(original.manual_adjustment_total || '0.00'); const adjustmentMoney = manualMoney(adjustmentRaw.replace(/^-/, ''));
    if (adjustmentMoney == null) return null;
    const adjustment = adjustmentRaw.startsWith('-') ? -adjustmentMoney : adjustmentMoney;
    const total = override == null ? normal + adjustment : manualMoney(override);
    if (total == null || total < 0n || total > MANUAL_MAX_CENTS || normal > MANUAL_MAX_CENTS) return null;
    return { subtotal: manualAmount(subtotal), discount: manualAmount(discount), shipping: manualAmount(delivery), tax: manualAmount(tax),
        total: manualAmount(total), adjustment: manualAmount(total - normal), included: pricing?.tax_prices_include };
}

export function orderEditPayload(lines, fields, shipping, totals, token, key) {
    if (!totals || !lines.length || lines.length > 100) return null;
    return { request_key: key, expected_token: token, customer_name: fields.name.trim(), customer_phone: fields.phone.trim(), customer_email: fields.email.trim() || null,
        shipping_address: { country: fields.country || null, region: fields.region.trim() || null, city: fields.city.trim() || null, line1: fields.address.trim() || null,
            line2: fields.line2.trim() || null, phone_alt: fields.phoneAlt.trim() || null }, shipping_total: manualAmount(manualMoney(shipping)), note: fields.note.trim() || null,
        ...(fields.override != null ? { grand_total: totals.total } : {}),
        items: lines.map(line => line.itemId ? { item_id: line.itemId, quantity: Number(line.quantity), unit_price: manualAmount(manualMoney(line.unitPrice)) }
            : { product_id: line.product.id, variant_id: line.variant?.id ?? null, quantity: Number(line.quantity), unit_price: manualAmount(manualMoney(line.unitPrice)),
                expected_price: line.variant?.price ?? line.product.price, price_overridden: Boolean(line.priceEdited), personalization: line.personalization || {} }) };
}
