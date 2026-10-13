export const ORDER_FILTERS = [
    ['order_id', 'المعرف', 'ID', 'number'], ['customer', 'اسم العميل', 'Customer name', 'text'],
    ['customer_phone', 'رقم هاتف العميل', 'Customer phone', 'text'], ['address', 'عنوان العميل', 'Customer address', 'text'],
    ['date_from', 'بداية التاريخ', 'Start date', 'date'], ['date_to', 'نهاية التاريخ', 'End date', 'date'],
    ['source', 'مصدر الحملة', 'Campaign source', 'text'], ['campaign', 'اسم الحملة', 'Campaign name', 'text'],
    ['coupon', 'الكوبون', 'Coupon', 'text'], ['product_id', 'المنتج', 'Product', 'product'],
];
export const ORDER_STATUSES = [
    ['pending', 'تحت المراجعة', 'Under review'], ['confirmed', 'تم التأكيد', 'Confirmed'],
    ['processing', 'قيد التجهيز للشحن', 'Preparing shipment'], ['shipped', 'قيد التوصيل', 'In transit'],
    ['delivered', 'تم التوصيل', 'Delivered'], ['cancelled', 'تم إلغاء الطلب', 'Cancelled'],
];
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
