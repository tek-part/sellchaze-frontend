/** Voltage section-settings readers — coercion + fail-safe fallbacks. */
import { describe, expect, it } from 'vitest';
import type { ThemeSettings } from '../../../theme-engine/types';
import { count, flag, lines, option, range, text } from './section-settings';

const S = (o: Record<string, unknown>): ThemeSettings => o as ThemeSettings;

describe('voltage section-settings', () => {
  it('text() returns strings, falls back otherwise', () => {
    expect(text(S({ a: 'hi' }), 'a')).toBe('hi');
    expect(text(S({ a: 5 }), 'a', 'fb')).toBe('fb');
    expect(text(S({}), 'missing')).toBe('');
  });

  it('flag() only accepts booleans', () => {
    expect(flag(S({ a: true }), 'a')).toBe(true);
    expect(flag(S({ a: 'true' }), 'a')).toBe(false);
    expect(flag(S({}), 'a', true)).toBe(true);
  });

  it('count() accepts finite numbers only', () => {
    expect(count(S({ a: 3 }), 'a', 0)).toBe(3);
    expect(count(S({ a: Infinity }), 'a', 7)).toBe(7);
    expect(count(S({ a: 'x' }), 'a', 7)).toBe(7);
  });

  it('range() clamps to [min, max]', () => {
    expect(range(S({ a: 99 }), 'a', 4, 2, 6)).toBe(6);
    expect(range(S({ a: 1 }), 'a', 4, 2, 6)).toBe(2);
    expect(range(S({}), 'a', 4, 2, 6)).toBe(4);
  });

  it('option() only allows values in the allow-list', () => {
    const allowed = ['a', 'b'] as const;
    expect(option(S({ k: 'b' }), 'k', allowed, 'a')).toBe('b');
    expect(option(S({ k: 'z' }), 'k', allowed, 'a')).toBe('a');
    expect(option(S({}), 'k', allowed, 'a')).toBe('a');
  });

  it('lines() splits, trims, and drops blanks', () => {
    expect(lines(S({ a: 'one\n  two  \n\nthree' }), 'a')).toEqual(['one', 'two', 'three']);
    expect(lines(S({}), 'a')).toEqual([]);
  });
});
