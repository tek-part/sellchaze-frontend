import { describe, expect, it } from 'vitest';
import { orderAddress, orderFilterParams, orderPrintIds } from '../components/store/orders/order-workspace';
import { mapServerNotification } from '../utils/mapServerNotification';

describe('merchant order workspace boundaries', () => {
    it('preserves meaningful zero strings while dropping inactive filters', () => {
        expect(orderFilterParams({ customer_phone: '0', customer: '', source: null, product_id: '42' })).toEqual({ customer_phone: '0', product_id: '42' });
    });
    it('prints only distinct, bounded, positive integer identities', () => {
        expect(orderPrintIds('42,7,42')).toEqual([42, 7]);
        for (const value of ['0', '../42', '1e3', '9007199254740992', Array.from({ length: 101 }, (_, i) => i + 1).join(',')]) expect(orderPrintIds(value)).toEqual([]);
    });
    it('formats address values without metadata keys or nested objects', () => {
        expect(orderAddress({ line1: 'Review street', city: 'Cairo', area: 'Cairo', shipping_details: { secret: 'metadata' } })).toBe('Review street, Cairo');
    });
    it('derives export notification destinations from the actual export identity', () => {
        const exportId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
        const data = { type: 'store_order_export', export_id: exportId, store_id: 3, row_count: 4, url: 'https://foreign.test/private' };
        const t = (key, options) => typeof options === 'string' ? options : options?.defaultValue || key;
        expect(mapServerNotification({ data }, t).link).toBe(`/store/orders?export=${exportId}`);
        expect(mapServerNotification({ data: { ...data, url: `/stores/3/orders?export=${exportId}` } }, t).link).toBe(`/stores/3/orders?export=${exportId}`);
        expect(mapServerNotification({ data: { ...data, export_id: '../private' } }, t).link).toBeUndefined();
    });
});
