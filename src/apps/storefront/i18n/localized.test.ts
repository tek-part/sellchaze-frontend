import { describe, expect, it } from 'vitest';
import { pickLocaleContent, pickLocalized } from './localized';

describe('pickLocalized', () => {
  it('returns strings unchanged and empty for nullish', () => {
    expect(pickLocalized('legacy', 'ar')).toBe('legacy');
    expect(pickLocalized(null, 'ar')).toBe('');
    expect(pickLocalized(undefined, 'ar', 'en')).toBe('');
  });

  it('resolves locale → fallback → first non-empty', () => {
    expect(pickLocalized({ ar: 'أ', en: 'a' }, 'ar', 'en')).toBe('أ');
    expect(pickLocalized({ ar: '', en: 'a' }, 'ar', 'en')).toBe('a');
    expect(pickLocalized({ ar: '', en: '', fr: 'f' }, 'ar', 'en')).toBe('f');
    expect(pickLocalized({ ar: ' ', en: null }, 'ar', 'en')).toBe('');
  });

  it('ignores arrays and other non-record shapes', () => {
    expect(pickLocalized(['a'], 'ar')).toBe('');
    expect(pickLocalized(42, 'ar')).toBe('');
  });
});

describe('pickLocaleContent', () => {
  const payload = { en: { title: 'Hello' }, ar: { title: 'مرحبا' } };

  it('picks the requested locale', () => {
    expect(pickLocaleContent(payload, 'ar', 'en')).toEqual({ title: 'مرحبا' });
  });

  it('falls back to the store default, then to any non-empty copy', () => {
    expect(pickLocaleContent({ en: { title: 'Hello' }, ar: {} }, 'ar', 'en')).toEqual({ title: 'Hello' });
    expect(pickLocaleContent({ fr: { title: 'Salut' } }, 'ar', 'en')).toEqual({ title: 'Salut' });
  });

  it('returns null when nothing usable exists', () => {
    expect(pickLocaleContent(null, 'ar')).toBeNull();
    expect(pickLocaleContent({ en: {}, ar: {} }, 'ar', 'en')).toBeNull();
    expect(pickLocaleContent([], 'ar')).toBeNull();
  });
});
