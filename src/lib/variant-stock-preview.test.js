import { describe, expect, it } from 'vitest';
import { variantStockPreview, variantStockTargets } from './variant-stock-preview';

const rows = [{ id: 1, name: 'Blue', stock_quantity: 5, reserved_quantity: 2, track_inventory: true, edit_version: 'current' },
    { id: 2, name: 'Red', stock_quantity: 1, reserved_quantity: 0, track_inventory: false, edit_version: 'other' }];
describe('bulk stock review', () => {
    it('shows per-variant outcomes and preserves each tracking setting', () => {
        const result = variantStockPreview(rows, 'increase', '3', 'keep');
        expect(result.error).toBeNull();
        expect(result.rows.map((row) => [row.before, row.after, row.tracking])).toEqual([[5, 8, true], [1, 4, false]]);
        expect(variantStockPreview(rows, 'set', '2', 'on').rows.map((row) => row.after)).toEqual([2, 2]);
    });
    it('blocks reservation undercuts, tracking disable, negative results and overflow', () => {
        expect(variantStockPreview(rows, 'set', '1', 'keep').error).toBe('reserved');
        expect(variantStockPreview(rows, 'set', '5', 'off').error).toBe('reserved');
        expect(variantStockPreview(rows, 'decrease', '2', 'keep').error).toBe('quantity');
        expect(variantStockPreview(rows, 'increase', '100000000', 'keep').error).toBe('quantity');
        for (const quantity of ['', '1.2', '-1', 'Infinity']) expect(variantStockPreview(rows, 'set', quantity, 'keep').error).toBe('quantity');
    });
    it('freezes stock and editorial expectations for every selected target', () => {
        const selected = variantStockTargets(rows);
        expect(selected).toEqual([{ id: 1, version: 'current', expected_stock: 5, expected_reserved: 2, expected_tracking: true },
            { id: 2, version: 'other', expected_stock: 1, expected_reserved: 0, expected_tracking: false }]);
        const changed = [{ ...rows[0], stock_quantity: 9 }];
        expect(variantStockTargets(changed)[0].expected_stock).toBe(9);
        expect(selected[0].expected_stock).toBe(5);
    });
});
