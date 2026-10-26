import { describe, expect, it } from 'vitest';
import { chosenUnits, clampQuantity, fulfillmentPayload, safeTrackingUrl, vocabularyLabel, FULFILLMENT_STATUSES } from '../components/store/orders/order-fulfillments';

describe('fulfillment dialog payload', () => {
    it('sends only lines with units and trims tracking fields', () => {
        expect(fulfillmentPayload({ quantities: { 501: 1, 502: 0, 503: '2' }, carrier: 'aramex', carrierName: 'ignored', trackingNumber: '  AR123 ', trackingUrl: '', notify: true, note: ' ' })).toEqual({
            items: [{ store_order_item_id: 501, quantity: 1 }, { store_order_item_id: 503, quantity: 2 }],
            carrier: 'aramex', carrier_name: null, tracking_number: 'AR123', tracking_url: null, notify_customer: true, note: null,
        });
    });
    it('keeps the custom carrier name only for other carriers', () => {
        const body = fulfillmentPayload({ quantities: { 1: 1 }, carrier: 'other', carrierName: ' Local courier ', trackingNumber: '', trackingUrl: 'https://courier.example.test/t/1', notify: false, note: 'Fragile' });
        expect(body.carrier_name).toBe('Local courier');
        expect(body.tracking_url).toBe('https://courier.example.test/t/1');
        expect(body.notify_customer).toBe(false);
        expect(body.note).toBe('Fragile');
    });
});

describe('fulfillment helpers', () => {
    it('clamps stepper values to the unfulfilled units', () => {
        expect(clampQuantity(5, 2)).toBe(2);
        expect(clampQuantity(-1, 2)).toBe(0);
        expect(clampQuantity('1.7', 2)).toBe(1);
        expect(clampQuantity('abc', 2)).toBe(0);
        expect(chosenUnits({ 1: 2, 2: 0, 3: '1' })).toBe(3);
    });
    it('accepts only http(s) tracking links', () => {
        expect(safeTrackingUrl('https://www.aramex.com/track/results?ShipmentNumber=1')).toBe('https://www.aramex.com/track/results?ShipmentNumber=1');
        expect(safeTrackingUrl('javascript:alert(1)')).toBeNull();
        expect(safeTrackingUrl('')).toBeNull();
        expect(safeTrackingUrl(null)).toBeNull();
    });
    it('labels statuses in both languages', () => {
        expect(vocabularyLabel(FULFILLMENT_STATUSES, 'partial', true)).toBe('مشحون جزئيًا');
        expect(vocabularyLabel(FULFILLMENT_STATUSES, 'partial', false)).toBe('Partially fulfilled');
        expect(vocabularyLabel(FULFILLMENT_STATUSES, 'unknown', false)).toBe('unknown');
    });
});
