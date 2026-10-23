import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
    it('keeps dashboard paths with their query string', () => {
        expect(safeRedirect('/orders')).toBe('/orders');
        expect(safeRedirect('/store/orders?status=pending')).toBe('/store/orders?status=pending');
    });

    it('falls back for missing, external and protocol-relative targets', () => {
        for (const value of [null, undefined, '', 'orders', 'https://evil.example', '//evil.example', '/\\evil.example', 'javascript:alert(1)', '/ok\n//evil']) {
            expect(safeRedirect(value)).toBe('/dashboard');
        }
    });

    it('uses the given fallback', () => {
        expect(safeRedirect('https://evil.example', '/login')).toBe('/login');
    });
});
