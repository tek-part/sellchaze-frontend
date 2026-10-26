// Fulfillment (shipment) vocabulary shared by the order detail page and the orders list.
// Labels are [ar, en] pairs, like the rest of the orders workspace.

export const FULFILLMENT_STATUSES = [
    ['unfulfilled', 'غير مشحون', 'Unfulfilled'],
    ['partial', 'مشحون جزئيًا', 'Partially fulfilled'],
    ['fulfilled', 'مشحون بالكامل', 'Fulfilled'],
];
export const FULFILLMENT_STATUS_TONES = { unfulfilled: 'is-warning', partial: 'is-info', fulfilled: 'is-success' };

export const SHIPMENT_STATUSES = [
    ['pending', 'قيد التجهيز', 'Preparing'],
    ['in_transit', 'في الطريق', 'In transit'],
    ['delivered', 'تم التسليم', 'Delivered'],
    ['failed', 'تعذر التسليم', 'Delivery failed'],
    ['cancelled', 'ملغاة', 'Cancelled'],
];
export const SHIPMENT_STATUS_TONES = { pending: 'is-warning', in_transit: 'is-info', delivered: 'is-success', failed: 'is-critical', cancelled: '' };

/** Fallback when the summary has not loaded its carrier list; keys match the API. */
export const CARRIERS = [
    { key: 'bosta', name: 'Bosta', tracking_url_template: true },
    { key: 'aramex', name: 'Aramex', tracking_url_template: true },
    { key: 'smsa', name: 'SMSA Express', tracking_url_template: true },
    { key: 'dhl', name: 'DHL', tracking_url_template: true },
    { key: 'fedex', name: 'FedEx', tracking_url_template: true },
    { key: 'ups', name: 'UPS', tracking_url_template: true },
    { key: 'j_and_t', name: 'J&T Express', tracking_url_template: false },
    { key: 'mylerz', name: 'Mylerz', tracking_url_template: false },
    { key: 'other', name: 'Other', tracking_url_template: false },
];

/** Statuses an order can still ship from (confirmed steps through processing on the server). */
export const FULFILLABLE_ORDER_STATUSES = ['confirmed', 'processing', 'waiting_for_pickup', 'shipped'];

export const vocabularyLabel = (list, key, ar) => {
    const row = list.find(([value]) => value === key);
    return row ? (ar ? row[1] : row[2]) : key;
};

/** The carrier's display name, Arabic for the catch-all "other". */
export const carrierLabel = (carrier, ar) => (carrier.key === 'other' ? (ar ? 'شركة أخرى' : 'Other carrier') : carrier.name);

/** Clamp a stepper value to 0..max units. */
export const clampQuantity = (value, max) => Math.max(0, Math.min(max, Math.trunc(Number(value) || 0)));

/** Only http(s) links are shown or sent, whatever was typed or returned. */
export const safeTrackingUrl = (value) => {
    const url = String(value ?? '').trim();
    return /^https?:\/\/[^\s]+$/i.test(url) ? url : null;
};

/**
 * POST /orders/{order}/fulfillments body from the dialog state: only lines with units, trimmed tracking,
 * the custom carrier name only for "other", and the URL only when one was typed.
 */
export function fulfillmentPayload({ quantities, carrier, carrierName, trackingNumber, trackingUrl, notify, note }) {
    const items = Object.entries(quantities || {})
        .map(([id, quantity]) => ({ store_order_item_id: Number(id), quantity: Math.trunc(Number(quantity) || 0) }))
        .filter((row) => row.quantity > 0);
    return {
        items,
        carrier,
        carrier_name: carrier === 'other' && carrierName?.trim() ? carrierName.trim() : null,
        tracking_number: trackingNumber?.trim() || null,
        tracking_url: trackingUrl?.trim() || null,
        notify_customer: Boolean(notify),
        note: note?.trim() || null,
    };
}

/** Units chosen in the dialog. */
export const chosenUnits = (quantities) => Object.values(quantities || {}).reduce((sum, value) => sum + (Math.trunc(Number(value) || 0)), 0);
