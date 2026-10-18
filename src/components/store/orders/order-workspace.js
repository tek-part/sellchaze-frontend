export const ORDER_FILTERS = [
    ['order_id', 'المعرف', 'ID', 'number'], ['customer', 'اسم العميل', 'Customer name', 'text'],
    ['customer_phone', 'رقم هاتف العميل', 'Customer phone', 'text'], ['address', 'عنوان العميل', 'Customer address', 'text'],
    ['date_from', 'بداية التاريخ', 'Start date', 'date'], ['date_to', 'نهاية التاريخ', 'End date', 'date'],
    ['source', 'مصدر الحملة', 'Campaign source', 'text'], ['campaign', 'اسم الحملة', 'Campaign name', 'text'],
    ['coupon', 'الكوبون', 'Coupon', 'text'], ['product_id', 'المنتج', 'Product', 'product'],
];
export const ORDER_STATUSES = [
    ['pending', 'تحت المراجعة', 'Under review'], ['confirmed', 'تم التأكيد', 'Confirmed'],
    ['processing', 'قيد التجهيز للشحن', 'Preparing shipment'], ['waiting_for_pickup', 'بانتظار الشحن', 'Waiting for pickup'],
    ['shipped', 'قيد التوصيل', 'In transit'], ['delivered', 'تم التوصيل', 'Delivered'], ['cancelled', 'تم الغاء الطلب', 'Cancelled'],
    ['returning_from_delivery', 'مرتجع من الشحن', 'Returning from delivery'], ['request_refund', 'العميل طلب الارجاع', 'Return requested'],
    ['refund_in_progress', 'جاري الارجاع', 'Return in progress'], ['refunded', 'تم الارجاع', 'Returned'],
];
export const ORDER_RISK_STATUSES = [['high_risk', 'High Risk', 'High Risk'], ['moderate_risk', 'Moderate Risk', 'Moderate Risk']];
export const ORDER_PAYMENT_STATUSES = [['pending_payment', 'في انتظار الدفع', 'Awaiting payment'], ['paid', 'تم الدفع', 'Paid'], ['paid_failed', 'فشل الدفع', 'Payment failed']];
export const ORDER_PAYMENT_TARGETS = { pending_payment: 'pending', paid: 'paid', paid_failed: 'failed' };
export const ORDER_BULK_STATUSES = [...ORDER_STATUSES.slice(0, 2), ...ORDER_PAYMENT_STATUSES, ...ORDER_STATUSES.slice(2), ...ORDER_RISK_STATUSES];
export const ORDER_RETURN_STATUSES = ['returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded'];
export function orderStatusLabel(value, ar) { const row = ORDER_STATUSES.find(([key]) => key === value); return row ? row[ar ? 1 : 2] : value; }
export function orderFilterParams(filters) { return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value != null)); }
export function orderAddress(address) {
    if (!address || typeof address !== 'object') return '';
    return [...new Set(['line1', 'line2', 'address', 'street', 'area', 'area_name', 'city', 'governorate', 'governorate_name', 'state', 'country', 'country_name', 'postal_code'].map(key => address[key]).filter(value => typeof value === 'string' || typeof value === 'number').map(String).map(value => value.trim()).filter(Boolean))].join(', ');
}
export function orderPrintIds(value) {
    const parts = String(value || '').split(',');
    if (parts.length > 100 || parts.some(value => !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))) return [];
    return [...new Set(parts.map(Number))];
}
