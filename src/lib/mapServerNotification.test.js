import { describe, expect, it } from 'vitest';
import { mapServerNotification } from '../utils/mapServerNotification';
import i18n from '../i18n';

const t = (key, options) => typeof options === 'string' ? options : options?.defaultValue || key;
describe('notification content', () => {
    it('uses the store order identity for its actual detail route', () => {
        const row = { id: 'abc', data: { type: 'store_order', event: 'created', store_id: 4, order_id: 42, order_number: 'ORD-42', status: 'pending' } };
        expect(mapServerNotification(row, t).link).toBe('/store/orders/42');
        expect(mapServerNotification({ ...row, data: { ...row.data, order_id: '../admin' } }, t).link).toBeUndefined();
    });
    it('keeps unknown payload internals out of the merchant notification body', () => {
        expect(mapServerNotification({ data: { internal_id: 42, secret: 'internal' } }, t).body).toBe('notif_type_generic_body');
        expect(mapServerNotification({ data: { preview: 'Readable alert' } }, t).body).toBe('Readable alert');
    });
    it('shows notifications left over from the retired B2B system as generic ones without dead links', () => {
        for (const type of ['order', 'quotation', 'ticket_reply', 'ticket_created', 'shipping_updated', 'order_assigned_to_supplier', 'invitation']) {
            const row = mapServerNotification({ id: 1, data: { type, order_code: 'B2B-1', ticket_id: 3 } }, t);
            expect(row.title).toBe('notif_type_generic_title');
            expect(row.link).toBeUndefined();
        }
        expect(mapServerNotification({ id: 2, data: { type: 'inventory_low', product_id: 5, qty_available: 1 } }, t).link).toBeUndefined();
    });
    it('renders real stored fulfillment notifications in both languages without claiming a payment refund', () => {
        const statuses = ['waiting_for_pickup', 'returning_from_delivery', 'request_refund', 'refund_in_progress', 'refunded'];
        for (const lng of ['ar', 'en']) {
            const translate = i18n.getFixedT(lng);
            for (const status of statuses) {
                const row = mapServerNotification({ data: { type: 'store_order', event: 'updated', order_id: 42, order_number: 'ORD-42', status } }, translate);
                expect(row.body).toContain('ORD-42');
                expect(row.body).not.toContain(status);
                expect(row.body).not.toContain('store_order_status_');
                expect(row.link).toBe('/store/orders/42');
            }
            const returned = mapServerNotification({ data: { type: 'store_order', status: 'refunded' } }, translate);
            expect(returned.body).toContain(lng === 'ar' ? 'تم الارجاع' : 'Returned');
            expect(returned.body.toLowerCase()).not.toMatch(/refunded|تم رد|استرداد المبلغ/);
        }
    });
});
