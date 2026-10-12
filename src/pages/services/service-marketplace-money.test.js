import { describe, expect, it } from 'vitest';
import { parseServicePrice } from './service-marketplace-money';
describe('Service publication prices', () => {
    it('keeps exact minor units without silently rounding unsupported precision', () => {
        expect(parseServicePrice('550.01', 'EGP')).toBe(55001);
        expect(parseServicePrice('0', 'EGP')).toBe(0);
        expect(parseServicePrice('0.001', 'EGP')).toBe(null);
        expect(parseServicePrice('2.125', 'KWD')).toBe(2125);
        expect(parseServicePrice('1e3', 'EGP')).toBe(null);
        expect(parseServicePrice('-10', 'EGP')).toBe(null);
        expect(parseServicePrice('1000000.00', 'EGP')).toBe(null);
    });
    it('accepts Arabic and Persian digits while rejecting ambiguous thousands separators', () => {
        expect(parseServicePrice('٥٥٠٫١٢', 'EGP')).toBe(55012);
        expect(parseServicePrice('۱۲۳٫۴۵', 'EGP')).toBe(12345);
        expect(parseServicePrice('1,234', 'EGP')).toBe(null);
        expect(parseServicePrice('', 'EGP')).toBe(null);
    });
});
