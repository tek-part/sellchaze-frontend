import { describe, expect, it } from 'vitest';
import { clampQuantity, customLine, draftPayload, emptyDraftState, mergeProductLines, parseTags, stateFromDraft, validMoney, whatsappShareUrl } from '../components/store/orders/draft-orders';

const shirt = { product: { id: 7, name: 'Shirt', price: '100.00', image_url: null }, variant: null };
const large = { product: { id: 7, name: 'Shirt', price: '100.00' }, variant: { id: 3, name: 'Large', options: { Size: 'L' }, price: '120.00' } };

describe('draft order editor contract', () => {
    it('merges picker selections and clamps quantities', () => {
        const lines = mergeProductLines([], [shirt, large]);
        expect(lines.map((line) => [line.product_id, line.variant_id, line.title, line.quantity])).toEqual([[7, null, 'Shirt', 1], [7, 3, 'Shirt — Large', 1]]);
        const again = mergeProductLines(lines, [shirt]);
        expect(again[0].quantity).toBe(2);
        expect(lines[0].quantity).toBe(1);
        expect([clampQuantity('0'), clampQuantity('abc'), clampQuantity(5000), clampQuantity('3.7')]).toEqual([1, 1, 999, 3]);
    });

    it('builds the API payload without client prices for catalog lines', () => {
        const state = { ...emptyDraftState(), customer: { name: ' Laila ', email: '', phone: '+201001112233' }, address: { line1: '12 Nile St', city: '', country: 'EG' },
            lines: [...mergeProductLines([], [large]), customLine({ title: ' Gift wrap ', price: '5.00', quantity: 2, requiresShipping: false })],
            discount: { type: 'manual', code: '', value_type: 'percentage', value: '10', reason: ' VIP ' },
            shipping: { type: 'custom', shipping_region_id: '', shipping_option_id: '', title: 'Courier', price: '12' }, note: '  ', tags: ['vip', ' '] };
        expect(draftPayload(state)).toEqual({
            store_customer_id: null,
            customer: { name: 'Laila', phone: '+201001112233' },
            shipping_address: { line1: '12 Nile St', country: 'EG' },
            line_items: [{ type: 'product', product_id: 7, variant_id: 3, quantity: 1 }, { type: 'custom', title: 'Gift wrap', unit_price: '5.00', quantity: 2, requires_shipping: false }],
            applied_discount: { type: 'manual', value_type: 'percentage', value: '10', reason: 'VIP' },
            shipping_line: { type: 'custom', title: 'Courier', price: '12' },
            note: null,
            tags: ['vip'],
        });
        expect(draftPayload({ ...state, discount: { type: 'code', code: ' save10 ' }, shipping: { type: 'rate', shipping_option_id: 'opt-1', shipping_region_id: '' } }))
            .toMatchObject({ applied_discount: { type: 'code', code: 'save10' }, shipping_line: { type: 'rate', shipping_option_id: 'opt-1' } });
        expect(draftPayload({ ...state, discount: { type: 'manual', value: '1e3' }, shipping: { type: 'none' } })).toMatchObject({ applied_discount: null, shipping_line: null });
    });

    it('round-trips a stored draft into editor state', () => {
        const state = stateFromDraft({ store_customer_id: 4, customer: { name: 'Laila' }, shipping_address: { line1: 'x' }, line_items: [{ type: 'custom', title: 'Fee', unit_price: '5.00', quantity: 1, requires_shipping: true }],
            applied_discount: { type: 'code', code: 'TEN' }, shipping_line: { type: 'rate', shipping_option_id: 'o1' }, note: 'n', tags: ['a'] });
        expect(state.customerId).toBe(4);
        expect(state.discount).toMatchObject({ type: 'code', code: 'TEN' });
        expect(state.shipping).toMatchObject({ type: 'rate', shipping_option_id: 'o1' });
        expect(draftPayload(state).line_items).toEqual([{ type: 'custom', title: 'Fee', unit_price: '5.00', quantity: 1, requires_shipping: true }]);
    });

    it('validates money, tags and builds a wa.me share link without sending anything', () => {
        expect([validMoney('10'), validMoney('10.5'), validMoney('10.555'), validMoney('-1'), validMoney('')]).toEqual([true, true, false, false, false]);
        expect(parseTags('vip, vip ,  whatsapp,')).toEqual(['vip', 'whatsapp']);
        expect(whatsappShareUrl('+20 100 111 2233', 'Pay here: https://a.test/invoices/x')).toBe('https://wa.me/201001112233?text=Pay%20here%3A%20https%3A%2F%2Fa.test%2Finvoices%2Fx');
    });
});
