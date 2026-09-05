import { describe, expect, it } from 'vitest';
import { completeness, isLocalized, pickLocalized, setLocalized, toLocalized } from './localized';

describe('isLocalized', () => {
    it('detects locale-keyed objects', () => {
        expect(isLocalized({ ar: 'أ', en: 'a' })).toBe(true);
        expect(isLocalized({ en: null })).toBe(true);
        expect(isLocalized({ 'en-US': 'a' })).toBe(true);
    });
    it('rejects strings, arrays, empty and non-locale objects', () => {
        expect(isLocalized('hello')).toBe(false);
        expect(isLocalized(null)).toBe(false);
        expect(isLocalized([])).toBe(false);
        expect(isLocalized({})).toBe(false);
        expect(isLocalized({ title: 'x' })).toBe(false);
        expect(isLocalized({ en: { nested: true } })).toBe(false);
    });
});

describe('pickLocalized', () => {
    it('passes strings through and handles nullish', () => {
        expect(pickLocalized('legacy', 'ar')).toBe('legacy');
        expect(pickLocalized(null, 'ar')).toBe('');
        expect(pickLocalized(undefined, 'ar')).toBe('');
    });
    it('resolves locale → fallback → first non-empty → empty', () => {
        expect(pickLocalized({ ar: 'أ', en: 'a' }, 'ar', 'en')).toBe('أ');
        expect(pickLocalized({ ar: '', en: 'a' }, 'ar', 'en')).toBe('a');
        expect(pickLocalized({ ar: '', en: '', fr: 'f' }, 'ar', 'en')).toBe('f');
        expect(pickLocalized({ ar: '  ', en: null }, 'ar', 'en')).toBe('');
    });
});

describe('toLocalized / setLocalized', () => {
    it('lands a legacy string on the default locale and fills the rest', () => {
        expect(toLocalized('Hi', ['ar', 'en'], 'en')).toEqual({ ar: '', en: 'Hi' });
        expect(toLocalized('Hi', ['ar', 'en'])).toEqual({ ar: 'Hi', en: '' });
        expect(toLocalized(undefined, ['ar', 'en'], 'ar')).toEqual({ ar: '', en: '' });
    });
    it('normalises objects without losing extra locales', () => {
        expect(toLocalized({ en: 'a', fr: 'f' }, ['ar', 'en'], 'ar')).toEqual({ ar: '', en: 'a', fr: 'f' });
        expect(toLocalized({ en: null }, ['ar', 'en'], 'ar')).toEqual({ ar: '', en: '' });
    });
    it('setLocalized returns a new object with one locale changed', () => {
        const orig = { ar: 'أ', en: 'a' };
        const next = setLocalized(orig, 'en', 'b', ['ar', 'en'], 'ar');
        expect(next).toEqual({ ar: 'أ', en: 'b' });
        expect(orig.en).toBe('a');
        expect(setLocalized('legacy', 'en', 'b', ['ar', 'en'], 'ar')).toEqual({ ar: 'legacy', en: 'b' });
    });
});

describe('completeness', () => {
    it('counts per-locale copies (content page shape)', () => {
        const data = { ar: { title: 'ع', body: '' }, en: { title: 'T', body: 'B' } };
        expect(completeness(data, ['ar', 'en'])).toEqual({
            ar: { filled: 1, total: 2, ratio: 0.5 },
            en: { filled: 2, total: 2, ratio: 1 },
        });
    });
    it('restricts per-locale counting to the given keys', () => {
        const data = { ar: { title: 'ع', image: 'x.png' }, en: { title: '', image: 'x.png' } };
        expect(completeness(data, ['ar', 'en'], ['title'])).toEqual({
            ar: { filled: 1, total: 1, ratio: 1 },
            en: { filled: 0, total: 1, ratio: 0 },
        });
    });
    it('counts a field map of localized values (theme settings shape)', () => {
        const values = { headline: { ar: 'ع', en: '' }, tagline: 'legacy', cta: { ar: '', en: 'Go' } };
        expect(completeness(values, ['ar', 'en'])).toEqual({
            ar: { filled: 2, total: 3, ratio: 2 / 3 },
            en: { filled: 2, total: 3, ratio: 2 / 3 },
        });
    });
    it('does not mistake short field ids for locales (field-map shape)', () => {
        expect(isLocalized({ cta: 'Go' })).toBe(false);
        expect(completeness({ cta: { ar: '', en: 'Go' } }, ['ar', 'en'])).toEqual({
            ar: { filled: 0, total: 1, ratio: 0 },
            en: { filled: 1, total: 1, ratio: 1 },
        });
        // A single-field map keyed by a locale-looking id still resolves by its VALUE shape.
        expect(completeness({ en: { ar: 'x', en: '' } }, ['ar', 'en']).ar.filled).toBe(1);
    });
    it('treats arrays (lines / repeaters) as filled when any item is', () => {
        const data = { ar: { lines: ['', 'x'] }, en: { lines: [] } };
        expect(completeness(data, ['ar', 'en']).ar.filled).toBe(1);
        expect(completeness(data, ['ar', 'en']).en.filled).toBe(0);
    });
    it('is total on empty / bad input', () => {
        expect(completeness(null, ['ar', 'en'])).toEqual({
            ar: { filled: 0, total: 0, ratio: 1 },
            en: { filled: 0, total: 0, ratio: 1 },
        });
    });
});
