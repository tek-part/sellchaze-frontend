/** Labels for fake-order protection rules, shared by the app settings page and the order page. */
export const PROTECTION_RULES = ['repeat_phone', 'open_cod', 'blocked_words', 'high_quantity'];

const LABELS = {
    repeat_phone: ['طلبات متكررة من نفس الهاتف', 'Repeated orders from the same phone'],
    open_cod: ['طلبات دفع عند الاستلام مفتوحة لنفس الهاتف', 'Open cash-on-delivery orders for the same phone'],
    blocked_words: ['كلمات ممنوعة في الاسم أو العنوان', 'Blocked words in the name or address'],
    high_quantity: ['كمية كبيرة بشكل غير معتاد', 'Unusually high quantity'],
};

export function protectionRuleLabel(rule, ar) {
    return LABELS[rule]?.[ar ? 0 : 1] ?? rule;
}

/** One sentence per fired rule, from the server's recorded detail. */
export function protectionSignalText(signal, ar) {
    const detail = signal?.detail || {};
    const label = protectionRuleLabel(signal?.rule, ar);
    switch (signal?.rule) {
        case 'repeat_phone': return ar ? `${label}: ${detail.orders} طلب خلال ${detail.hours} ساعة` : `${label}: ${detail.orders} earlier order(s) within ${detail.hours} hours`;
        case 'open_cod': return ar ? `${label}: ${detail.open_orders} طلب مفتوح` : `${label}: ${detail.open_orders} open order(s)`;
        case 'blocked_words': return ar ? `${label}: «${detail.word}»` : `${label}: “${detail.word}”`;
        case 'high_quantity': return ar ? `${label}: ${detail.units} قطعة (الحد ${detail.max_units})` : `${label}: ${detail.units} items (limit ${detail.max_units})`;
        default: return label;
    }
}
