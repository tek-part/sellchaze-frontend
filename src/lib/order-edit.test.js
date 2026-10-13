import { describe, expect, it } from 'vitest';
import { orderEditLines, orderEditPayload, orderEditTotals } from '../components/store/orders/order-edit';

const original = { items: [{ id: 7, store_product_id: 2, name: 'Fixture snapshot', unit_price: '25.00', quantity: 2, personalization: [{ key: 'message', value: 'Retained fixture' }] }], subtotal: '50.00', shipping_total: '5.00', discount_total: '10.00', tax_total: '2.00', grand_total: '42.00', manual_adjustment_total: '-5.00', manual_tax_included: false };
const pricing = { tax_enabled: true, tax_rate: '5.000', tax_prices_include: false };
const fields = { name: ' Fixture ', phone: ' +201000000007 ', email: '', country: 'EG', region: 'Fixture region', city: '', address: ' Fixture address ', line2: '', phoneAlt: '', note: '', override: null };

describe('order editing totals and snapshot identity', () => {
    it('preserves recorded economics for contact corrections even when current tax rules differ', () => {
        expect(orderEditTotals(orderEditLines(original), '5', { ...pricing, tax_rate: '20.000' }, original)).toMatchObject({ total: '42.00', tax: '2.00', adjustment: '-5.00' });
    });
    it('recalculates exact amounts while retaining the recorded discount and adjustment', () => {
        const lines = orderEditLines(original).map(line => ({ ...line, quantity: '3', unitPrice: '20.00' }));
        expect(orderEditTotals(lines, '6.00', pricing, original)).toEqual({ subtotal: '60.00', discount: '10.00', shipping: '6.00', tax: '2.50', total: '53.50', adjustment: '-5.00', included: false });
        expect(orderEditTotals(lines, '6.00', pricing, original, '60.01')).toMatchObject({ total: '60.01', adjustment: '1.51' });
    });
    it('keeps retained IDs and customizations separate from new product selections', () => {
        const lines = orderEditLines(original); const totals = orderEditTotals(lines, '5.00', pricing, original);
        const payload = orderEditPayload(lines, fields, '5.00', totals, 'state-token', 'attempt-key');
        expect(payload.items).toEqual([{ item_id: 7, quantity: 2, unit_price: '25.00' }]);
        expect(payload.customer_name).toBe('Fixture'); expect(payload).not.toHaveProperty('grand_total');
        const newLine = { key: '9:base', product: { id: 9, price: '0.10' }, quantity: '1', unitPrice: '0.20', priceEdited: true, personalization: { message: 'New fixture' } };
        const nextTotals = orderEditTotals([...lines, newLine], '5', pricing, original);
        expect(orderEditPayload([...lines, newLine], fields, '5', nextTotals, 'state-token', 'attempt-key').items[1]).toMatchObject({ product_id: 9, expected_price: '0.10', unit_price: '0.20', price_overridden: true, personalization: { message: 'New fixture' } });
    });
    it('rejects invalid quantities, scientific money, overflow and negative adjusted totals', () => {
        for (const quantity of ['2e0', '2.5', '0', '1000']) expect(orderEditTotals(orderEditLines(original).map(line => ({ ...line, quantity })), '5', pricing, original)).toBeNull();
        expect(orderEditTotals(orderEditLines(original).map(line => ({ ...line, unitPrice: '1e2' })), '5', pricing, original)).toBeNull();
        expect(orderEditTotals(orderEditLines(original).map(line => ({ ...line, unitPrice: '9999999999.99', quantity: '999' })), '5', pricing, original)).toBeNull();
        expect(orderEditTotals(orderEditLines(original).map(line => ({ ...line, unitPrice: '0', quantity: '1' })), '0', pricing, original)).toBeNull();
    });
});
