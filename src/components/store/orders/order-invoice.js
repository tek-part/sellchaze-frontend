// G1 (TAR-036 #2): the printable invoice's address block and payment line.
import { paymentSplit } from '../../../lib/order-deposit';

const text = (value) => (typeof value === 'string' || typeof value === 'number') && String(value).trim() ? String(value).trim() : '';
const first = (address, keys) => keys.map((key) => text(address?.[key])).find(Boolean) || '';

/** Governorate, area, street and every phone on the order (deduplicated), for the delivery block. */
export function invoiceAddress(order) {
    const address = order?.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address : {};
    const governorate = first(address, ['governorate_name', 'governorate', 'region', 'state']);
    const area = first(address, ['area_name', 'area', 'district', 'city']);
    const street = [...new Set(['line1', 'line2', 'address', 'street'].map((key) => text(address[key])).filter(Boolean))].join('، ');
    const phones = [...new Set([order?.customer?.phone, address.phone, address.phone_alt].map(text).filter(Boolean))];
    return { governorate, area: area === governorate ? '' : area, street, phones, country: first(address, ['country_name', 'country']) };
}

/** The payment line printed for the courier and the customer. */
export function invoicePaymentLine(order, ar) {
    const split = paymentSplit(order);
    const money = (value) => `${order.currency} ${value}`;
    switch (split.kind) {
        case 'deposit_paid': return Number(split.remaining) > 0
            ? (ar ? `مدفوع ${money(split.paid)} · المتبقي عند الاستلام ${money(split.remaining)}` : `Paid ${money(split.paid)} · Remaining on delivery ${money(split.remaining)}`)
            : (ar ? 'مدفوع بالكامل' : 'Paid in full');
        case 'deposit_due': return ar ? `عربون مطلوب ${money(split.due)} · المتبقي عند الاستلام ${money(split.remaining)}` : `Deposit due ${money(split.due)} · Remaining on delivery ${money(split.remaining)}`;
        case 'cod': return ar ? `الدفع عند الاستلام · المطلوب تحصيله ${money(split.remaining)}` : `Cash on delivery · Collect ${money(split.remaining)}`;
        case 'paid': return ar ? 'مدفوع بالكامل' : 'Paid in full';
        default: return ar ? `بانتظار الدفع ${money(split.remaining)}` : `Awaiting payment ${money(split.remaining)}`;
    }
}

/** The amount the courier collects, shown large on the invoice. */
export function invoiceCollect(order) {
    const split = paymentSplit(order);
    return split.kind === 'paid' || split.kind === 'unpaid' ? '0.00' : split.remaining;
}
