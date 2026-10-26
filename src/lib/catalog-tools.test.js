import { describe, expect, it } from 'vitest';
import { SHEET_CLEAR, estimatePrice, importProgress, importRunning, keyboardTarget, moveItem, orderChanged, priceChangePayload, sheetErrorText, validPriceValue } from '../components/store/catalog-tools';

describe('catalog option ordering', () => {
    it('moves items without mutating the source and clamps targets', () => {
        const list = ['S', 'M', 'L'];
        expect(moveItem(list, 2, 0)).toEqual(['L', 'S', 'M']);
        expect(moveItem(list, 0, 9)).toEqual(['M', 'L', 'S']);
        expect(moveItem(list, 5, 0)).toEqual(list);
        expect(list).toEqual(['S', 'M', 'L']);
    });
    it('maps keyboard keys to bounded targets', () => {
        expect([keyboardTarget('ArrowUp', 0, 3), keyboardTarget('ArrowUp', 2, 3), keyboardTarget('ArrowDown', 2, 3), keyboardTarget('Home', 2, 3), keyboardTarget('End', 0, 3), keyboardTarget('Enter', 1, 3)]).toEqual([null, 1, null, 0, 2, null]);
        expect(orderChanged([1, 2, 3], [1, 2, 3])).toBe(false);
        expect(orderChanged([1, 2, 3], [2, 1, 3])).toBe(true);
    });
});

describe('bulk price change form', () => {
    const form = { direction: 'increase', kind: 'percent', value: '10', applyCompare: true, applyVariants: false, rounding: 'ceil' };
    it('builds the API payload and validates values', () => {
        expect(priceChangePayload(form, { type: 'category', category_id: 4 })).toEqual({ scope: { type: 'category', category_id: 4 }, direction: 'increase', kind: 'percent', value: '10', apply_compare: true, apply_variants: false, rounding: 'ceil' });
        expect([validPriceValue(form), validPriceValue({ ...form, value: '0' }), validPriceValue({ ...form, value: '1.12345' }), validPriceValue({ ...form, direction: 'decrease', value: '101' }), validPriceValue({ ...form, kind: 'amount', direction: 'decrease', value: '101' })]).toEqual([true, false, false, false, true]);
    });
    it('estimates rounded prices like the server', () => {
        expect(estimatePrice('99.99', { ...form, rounding: 'none' })).toBe('109.99');
        expect(estimatePrice('10.40', { ...form, value: '15' })).toBe('12.00');
        expect(estimatePrice('10.40', { ...form, kind: 'amount', value: '0.75', rounding: 'floor' })).toBe('11.00');
        expect(estimatePrice('3', { ...form, kind: 'amount', direction: 'decrease', value: '6' })).toBeNull();
    });
});

describe('imports', () => {
    it('reports progress and running state', () => {
        expect(importProgress({ status: 'processing', total_rows: 200, processed_rows: 50 })).toBe(25);
        expect(importProgress({ status: 'queued', total_rows: null, processed_rows: 0 })).toBeNull();
        expect(importProgress({ status: 'completed', total_rows: 0, processed_rows: 0 })).toBe(100);
        expect([importRunning({ status: 'queued' }), importRunning({ status: 'failed' }), importRunning(null)]).toEqual([true, false, false]);
    });
    it('localizes sheet row errors with a server fallback', () => {
        expect(sheetErrorText({ code: 'sku_taken', message: 'x' }, true)).toContain('رمز المخزون');
        expect(sheetErrorText({ code: 'duplicate_row', message: 'Row 2 already updates this product.' }, false)).toContain('Row 2');
        expect(sheetErrorText({ code: 'unknown', message: 'Server text' }, false)).toBe('Server text');
        expect(sheetErrorText({ code: 'category_not_found', message: 'x' }, false)).toContain('category IDs');
        expect(SHEET_CLEAR).toBe('[clear]');
    });
});
