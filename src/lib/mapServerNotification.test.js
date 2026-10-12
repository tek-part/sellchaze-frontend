import { describe, expect, it } from 'vitest';
import { mapServerNotification } from '../utils/mapServerNotification';

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
});
