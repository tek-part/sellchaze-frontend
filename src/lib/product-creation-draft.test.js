import { describe, expect, it } from 'vitest';
import { compileProductProperties, buildCreationRows, creationPayload, regularPrice, setRegularPrice, setDiscountPrice } from './product-creation-draft';

const axis = (name, values, type = 'buttons', id = 'one') => ({ id, name, values, type, colors: {} });
describe('initial product options and pricing', () => {
    it('builds combinations and customer input independently with color metadata', () => {
        const result = compileProductProperties([axis('Color', 'Blue, Red', 'color'), axis('Size', 'S، M'), axis('Engraving', '', 'text', 'two')]);
        expect(result.valid).toBe(true);
        expect(result.combinations).toHaveLength(4);
        expect(result.combinations[0]).toEqual({ Color: 'Blue', Size: 'S' });
        expect(result.fields[0]).toMatchObject({ key: 'p_two', type: 'text', label: 'Engraving' });
        expect(result.display[0].values[0].color).toBe('#000000');
    });
    it('rejects ambiguous properties and unbounded combinations before building rows', () => {
        expect(compileProductProperties([axis('Color', 'Blue, blue')]).valid).toBe(false);
        expect(compileProductProperties([axis('Color', 'Blue'), axis(' color ', 'Red')]).valid).toBe(false);
        expect(compileProductProperties([axis('42', 'Blue')]).valid).toBe(false);
        expect(compileProductProperties([axis('Color', ' ')]).valid).toBe(false);
        const values = Array.from({ length: 15 }, (_, i) => String(i)).join(',');
        expect(compileProductProperties([axis('One', values), axis('Two', values)]).reason).toBe('limit');
    });
    it('preserves stock, SKU and explicit free prices for retained combinations', () => {
        const first = compileProductProperties([axis('Color', 'Blue, Red')]);
        const rows = buildCreationRows(first.combinations); rows[0] = { ...rows[0], sku: 'BLUE', price_override: '0', stock_quantity: '8' };
        const second = compileProductProperties([axis('Color', 'Green, Blue')]);
        const next = buildCreationRows(second.combinations, rows);
        expect(next[1]).toBe(rows[0]);
        expect(creationPayload(next, { stock_quantity: '99', track_inventory: true })).toMatchObject({ inventory: { stock_quantity: 0 }, variants: [{ price_override: null, stock_quantity: 0 }, { sku: 'BLUE', price_override: '0', stock_quantity: 8 }] });
    });
    it('keeps no-options stock and removes UI-only row state from the request', () => {
        expect(compileProductProperties([]).combinations).toEqual([]);
        expect(creationPayload([], { stock_quantity: '12', track_inventory: true })).toEqual({ variants: [], inventory: { stock_quantity: 12, track_inventory: true } });
    });
    it('binds image choices to file identity rather than a shifting gallery index', () => {
        const blue = { name: 'blue.png', type: 'image/png' }; const red = { name: 'red.png', type: 'image/png' };
        const property = { ...axis('Color', 'Blue', 'image'), images: { Blue: blue } };
        expect(compileProductProperties([property], [red, blue]).galleryImages).toEqual([{ axis: 'Color', value: 'Blue', index: 1 }]);
        expect(compileProductProperties([property], [blue]).galleryImages[0].index).toBe(0);
        expect(compileProductProperties([property], [red]).reason).toBe('images');
    });
    it('edits regular and sale prices without changing existing final-price semantics', () => {
        let draft = { price: '80', compare_price: '100', cost: '20' };
        expect(regularPrice(draft)).toBe('100');
        draft = setRegularPrice(draft, '110');
        expect(draft.price).toBe('80');
        draft = setDiscountPrice(draft, '0');
        expect(draft).toEqual({ price: '0', compare_price: '110', cost: '20' });
        expect(setDiscountPrice(draft, '')).toEqual({ price: '110', compare_price: '', cost: '20' });
        expect(setRegularPrice({ price: '', compare_price: '' }, '50')).toEqual({ price: '50', compare_price: '' });
    });
});
