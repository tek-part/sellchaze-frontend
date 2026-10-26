// Pure helpers for the draft-order editor: editor state <-> API payload, money and share links.

export const DRAFT_STATUSES = ['open', 'invoice_sent', 'completed', 'cancelled'];

const MONEY = /^\d{1,10}(\.\d{1,2})?$/;

export function validMoney(value) {
    return MONEY.test(String(value ?? '').trim());
}

let sequence = 0;
export function lineKey() {
    sequence += 1;
    return `line-${Date.now().toString(36)}-${sequence}`;
}

/** A product line from the manual-order picker selection. */
export function productLine(selection) {
    return {
        key: lineKey(), type: 'product', product_id: selection.product.id, variant_id: selection.variant?.id ?? null,
        title: selection.variant ? `${selection.product.name} — ${selection.variant.name}` : selection.product.name,
        variant_label: selection.variant ? (Object.entries(selection.variant.options || {}).map(([key, value]) => `${key}: ${value}`).join(' · ') || selection.variant.name) : '',
        image_url: selection.variant?.image_url || selection.product.image_url || null,
        unit_price: String(selection.variant?.price ?? selection.product.price ?? '0.00'), quantity: 1,
    };
}

export function customLine({ title, price, quantity = 1, requiresShipping = true }) {
    return { key: lineKey(), type: 'custom', title: title.trim(), unit_price: String(price).trim(), quantity: Number(quantity) || 1, requires_shipping: requiresShipping };
}

/** Lines returned by the API (stored draft) back into editor lines. */
export function linesFromDraft(lines = []) {
    return lines.map((line) => ({ ...line, key: lineKey(), variant_label: line.variant_name || '' }));
}

export function clampQuantity(value) {
    const number = Math.trunc(Number(value));
    if (!Number.isFinite(number) || number < 1) return 1;
    return Math.min(number, 999);
}

/** Merge picker selections into existing lines: same product+variant raises the quantity. */
export function mergeProductLines(lines, selections) {
    let next = [...lines];
    for (const selection of selections) {
        const line = productLine(selection);
        const index = next.findIndex((row) => row.type === 'product' && row.product_id === line.product_id && (row.variant_id ?? null) === line.variant_id);
        if (index >= 0) next = next.map((row, position) => (position === index ? { ...row, quantity: clampQuantity(Number(row.quantity) + 1) } : row));
        else next.push(line);
    }
    return next;
}

function text(value) {
    const trimmed = String(value ?? '').trim();
    return trimmed || null;
}

/** The request body for create/update/calculate. Product lines never send a price (the catalog prices them). */
export function draftPayload(state) {
    const customer = Object.fromEntries(['name', 'email', 'phone'].map((key) => [key, text(state.customer?.[key])]).filter(([, value]) => value));
    const address = Object.fromEntries(['line1', 'city', 'country'].map((key) => [key, text(state.address?.[key])]).filter(([, value]) => value));
    const discount = state.discount?.type === 'code' && text(state.discount.code)
        ? { type: 'code', code: text(state.discount.code) }
        : state.discount?.type === 'manual' && validMoney(state.discount.value)
            ? { type: 'manual', value_type: state.discount.value_type === 'percentage' ? 'percentage' : 'fixed', value: String(state.discount.value).trim(), reason: text(state.discount.reason) }
            : null;
    const shipping = state.shipping?.type === 'rate'
        ? { type: 'rate', ...(state.shipping.shipping_region_id ? { shipping_region_id: state.shipping.shipping_region_id } : {}), ...(state.shipping.shipping_option_id ? { shipping_option_id: state.shipping.shipping_option_id } : {}) }
        : state.shipping?.type === 'custom' && text(state.shipping.title) && validMoney(state.shipping.price)
            ? { type: 'custom', title: text(state.shipping.title), price: String(state.shipping.price).trim() }
            : null;
    return {
        store_customer_id: state.customerId ?? null,
        customer: Object.keys(customer).length ? customer : null,
        shipping_address: Object.keys(address).length ? address : null,
        line_items: state.lines.map((line) => line.type === 'product'
            ? { type: 'product', product_id: line.product_id, ...(line.variant_id ? { variant_id: line.variant_id } : {}), quantity: clampQuantity(line.quantity) }
            : { type: 'custom', title: line.title, unit_price: String(line.unit_price), quantity: clampQuantity(line.quantity), requires_shipping: line.requires_shipping !== false }),
        applied_discount: discount,
        shipping_line: shipping,
        note: text(state.note),
        tags: (state.tags || []).map((tag) => tag.trim()).filter(Boolean),
    };
}

/** Editor state from an API draft. */
export function stateFromDraft(draft) {
    const discount = draft.applied_discount;
    const shipping = draft.shipping_line;
    return {
        customerId: draft.store_customer_id ?? null,
        customer: { name: draft.customer?.name ?? '', email: draft.customer?.email ?? '', phone: draft.customer?.phone ?? '' },
        address: { line1: draft.shipping_address?.line1 ?? '', city: draft.shipping_address?.city ?? '', country: draft.shipping_address?.country ?? '' },
        lines: linesFromDraft(draft.line_items),
        discount: discount?.type === 'code' ? { type: 'code', code: discount.code, value_type: 'fixed', value: '', reason: '' }
            : discount?.type === 'manual' ? { type: 'manual', code: '', value_type: discount.value_type, value: discount.value, reason: discount.reason ?? '' }
                : { type: 'none', code: '', value_type: 'fixed', value: '', reason: '' },
        shipping: shipping?.type === 'rate' ? { type: 'rate', shipping_region_id: shipping.shipping_region_id ?? '', shipping_option_id: shipping.shipping_option_id ?? '', title: '', price: '' }
            : shipping?.type === 'custom' ? { type: 'custom', shipping_region_id: '', shipping_option_id: '', title: shipping.title, price: shipping.price }
                : { type: 'none', shipping_region_id: '', shipping_option_id: '', title: '', price: '' },
        note: draft.note ?? '',
        tags: draft.tags ?? [],
    };
}

export function emptyDraftState() {
    return stateFromDraft({ line_items: [], tags: [] });
}

export function parseTags(value) {
    return [...new Set(String(value ?? '').split(',').map((tag) => tag.trim()).filter(Boolean))].slice(0, 20);
}

/** wa.me link with the prefilled text; the merchant sends it from WhatsApp themselves. */
export function whatsappShareUrl(phone, message) {
    const digits = String(phone ?? '').replace(/\D/g, '');
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
