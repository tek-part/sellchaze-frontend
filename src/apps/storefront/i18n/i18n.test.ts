/**
 * i18n contract.
 *
 * The failure mode for a bilingual store is silent: a missing key falls back to English and the
 * page still renders, so an Arabic customer sees stray English with nothing logged. These pin the
 * guarantees that prevent that — matching key sets, real translations, and a direction that is
 * always derived from the language rather than tracked separately.
 */
import { describe, expect, it } from 'vitest';
import { en } from './en';
import { ar } from './ar';
import { DEFAULT_LOCALE, LOCALE_META, SUPPORTED_LOCALES, detectLocale, directionFor, isLocale } from './index';

type Dict = Record<string, Record<string, string>>;

const enDict = en as unknown as Dict;
const arDict = ar as unknown as Dict;

function keyPaths(dict: Dict): string[] {
  return Object.keys(dict)
    .flatMap((group) => Object.keys(dict[group]!).map((key) => `${group}.${key}`))
    .sort();
}

describe('translation completeness', () => {
  it('has identical key sets in both languages', () => {
    // A key present in one language only is the exact bug that surfaces as stray English.
    expect(keyPaths(arDict)).toEqual(keyPaths(enDict));
  });

  it('leaves no value empty', () => {
    for (const dict of [enDict, arDict]) {
      for (const group of Object.keys(dict)) {
        for (const [key, value] of Object.entries(dict[group]!)) {
          expect(value.trim(), `${group}.${key}`).not.toBe('');
        }
      }
    }
  });

  it('actually translates — Arabic values are not copied English', () => {
    // Brand-neutral UI copy should differ in every case; identical strings mean an untranslated key
    // slipped through with the English text pasted in.
    const identical: string[] = [];
    for (const group of Object.keys(enDict)) {
      for (const key of Object.keys(enDict[group]!)) {
        if (enDict[group]![key] === arDict[group]![key]) identical.push(`${group}.${key}`);
      }
    }
    expect(identical).toEqual([]);
  });

  it('contains Arabic script in every Arabic value', () => {
    const arabic = /[؀-ۿ]/;
    for (const group of Object.keys(arDict)) {
      for (const [key, value] of Object.entries(arDict[group]!)) {
        expect(arabic.test(value), `${group}.${key} → ${value}`).toBe(true);
      }
    }
  });

  it('preserves interpolation placeholders across languages', () => {
    const placeholders = (s: string): string[] => (s.match(/\{\{\w+\}\}/g) ?? []).sort();
    for (const group of Object.keys(enDict)) {
      for (const key of Object.keys(enDict[group]!)) {
        expect(placeholders(arDict[group]![key]!), `${group}.${key}`).toEqual(
          placeholders(enDict[group]![key]!),
        );
      }
    }
  });
});

describe('locale metadata', () => {
  it('maps each locale to the correct direction', () => {
    expect(directionFor('en')).toBe('ltr');
    expect(directionFor('ar')).toBe('rtl');
  });

  it('describes every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_META[locale].nativeLabel.length).toBeGreaterThan(0);
      expect(LOCALE_META[locale].htmlLang.length).toBeGreaterThan(0);
    }
  });

  it('labels each locale in its own script', () => {
    expect(LOCALE_META.ar.nativeLabel).toMatch(/[؀-ۿ]/);
  });

  it('narrows unknown values', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe('detectLocale', () => {
  it('honours an explicit ?lang override above anything else', () => {
    expect(detectLocale('?lang=ar')).toBe('ar');
    expect(detectLocale('?lang=en')).toBe('en');
  });

  it('ignores an unsupported language rather than failing', () => {
    // Falls through to storage/browser/default — never throws on hostile input.
    expect(SUPPORTED_LOCALES).toContain(detectLocale('?lang=zz'));
  });

  it('defaults to English', () => {
    expect(DEFAULT_LOCALE).toBe('en');
  });
});
