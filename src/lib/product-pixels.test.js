import { expect, it } from 'vitest';
import { compileProductPixels, productPixelRows } from './product-pixels';

it('preserves row order while normalizing IDs and removing duplicate destinations', () => {
    const rows = [{ provider: 'snapchat', id: '12345678-1234-4234-8234-123456789ABC' }, { provider: 'facebook', id: ' 1234567890 ' }, { provider: 'facebook', id: '1234567890' }];
    expect(compileProductPixels(productPixelRows(rows))).toEqual({ valid: true, value: [{ provider: 'snapchat', id: '12345678-1234-4234-8234-123456789abc' }, { provider: 'facebook', id: '1234567890' }] });
    expect(compileProductPixels([])).toEqual({ valid: true, value: null });
});
it('blocks incomplete rows, scripts, wrong provider identifiers and excessive destinations', () => {
    for (const row of [{ provider: '', id: '1234567890' }, { provider: 'facebook', id: '' }, { provider: 'facebook', id: '<script>' }, { provider: 'tiktok', id: 'lowercasebad' }, { provider: 'snapchat', id: '1234567890' }, { provider: 'google', id: 'G-Y1F28T2SY8' }, { provider: '__proto__', id: '1234567890' }]) expect(compileProductPixels([row]).valid).toBe(false);
    expect(compileProductPixels(Array.from({ length: 11 }, (_, i) => ({ provider: 'facebook', id: String(1234567890 + i) }))).valid).toBe(false);
});
