import { describe, expect, it } from 'vitest';
import { manualAmount, manualMoney, manualPayload, manualTotals } from '../components/store/orders/manual-order';

const line = { key: '1:base', product: { id: 1, price: '0.10' }, unitPrice: '0.10', quantity: '3', priceEdited: false };
const fields = { name: ' Local customer ', phone: ' +201000000001 ', email: '', address: ' Local address ', notes: '', totalOverride: null };

describe('manual order money and placement contract', () => {
    it('uses exact cents and refuses scientific, fractional quantity and unsupported totals', () => {
        expect(manualMoney('0.10')).toBe(10n);
        expect(manualMoney('1e2')).toBeNull();
        expect(manualMoney('1.001')).toBeNull();
        expect(manualMoney('10000000000.00')).toBeNull();
        expect(manualTotals([line], '0.20', {}, null).total).toBe('0.50');
        expect(manualTotals([{ ...line, quantity: '1.5' }], '0', {}, null)).toBeNull();
        expect(manualTotals([{ ...line, unitPrice: '9999999999.99', quantity: '999' }], '0', {}, null)).toBeNull();
        expect(manualAmount(-301n)).toBe('-3.01');
    });

    it('matches inclusive and exclusive tax truncation and keeps an explicit total adjustment', () => {
        const regular = [{ ...line, unitPrice: '20.00', quantity: '2' }];
        expect(manualTotals(regular, '5', { tax_enabled: true, tax_rate: '10.000', tax_prices_include: false }, '42.00')).toEqual({ subtotal: '40.00', shipping: '5.00', tax: '4.00', total: '42.00', adjustment: '-7.00' });
        expect(manualTotals(regular, '5', { tax_enabled: true, tax_rate: '10.000', tax_prices_include: true }, null)).toEqual({ subtotal: '40.00', shipping: '5.00', tax: '3.63', total: '45.00', adjustment: '0.00' });
    });

    it('preserves the retry identity, selected variant and authoritative default-price check', () => {
        const totals = manualTotals([line], '0.20', {}, null);
        const payload = manualPayload([line], fields, totals, 'owned-retry-key');
        expect(payload.request_key).toBe('owned-retry-key');
        expect(payload.customer_name).toBe('Local customer');
        expect(payload.items[0]).toEqual({ product_id: 1, variant_id: null, quantity: 3, expected_price: '0.10', personalization: {} });
        expect(payload).not.toHaveProperty('grand_total');
        const overridden = { ...line, variant: { id: 4, price: '0.15' }, unitPrice: '0.12', priceEdited: true };
        expect(manualPayload([overridden], { ...fields, totalOverride: '1.00' }, manualTotals([overridden], '0', {}, '1.00'), 'owned-retry-key').items[0]).toEqual({ product_id: 1, variant_id: 4, quantity: 3, expected_price: '0.15', unit_price: '0.12', personalization: {} });
    });
});
