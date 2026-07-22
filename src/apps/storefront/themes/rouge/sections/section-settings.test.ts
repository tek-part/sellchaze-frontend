/** Rouge — fail-safe section-settings readers. Pure logic (node env). */
import { describe, expect, it } from 'vitest';
import type { ThemeSettings } from '../../../theme-engine/types';
import { count, flag, lines, option, range, text } from './section-settings';

const s = (o: Record<string, unknown>): ThemeSettings => Object.freeze(o) as ThemeSettings;

describe('rouge section-settings', () => {
  it('text coerces + falls back', () => {
    expect(text(s({ a: 'hi' }), 'a')).toBe('hi');
    expect(text(s({ a: 42 }), 'a', 'fb')).toBe('fb');
    expect(text(s({}), 'missing', 'fb')).toBe('fb');
  });
  it('flag coerces booleans only', () => {
    expect(flag(s({ a: true }), 'a')).toBe(true);
    expect(flag(s({ a: 'true' }), 'a', false)).toBe(false);
    expect(flag(s({}), 'a', true)).toBe(true);
  });
  it('count accepts finite numbers only', () => {
    expect(count(s({ a: 5 }), 'a', 1)).toBe(5);
    expect(count(s({ a: Number.NaN }), 'a', 1)).toBe(1);
    expect(count(s({ a: '5' }), 'a', 1)).toBe(1);
  });
  it('range clamps to [min,max]', () => {
    expect(range(s({ a: 99 }), 'a', 4, 2, 6)).toBe(6);
    expect(range(s({ a: 0 }), 'a', 4, 2, 6)).toBe(2);
    expect(range(s({ a: 4 }), 'a', 4, 2, 6)).toBe(4);
    expect(range(s({}), 'a', 4, 2, 6)).toBe(4);
  });
  it('option validates against the allow-list', () => {
    expect(option(s({ a: 'center' }), 'a', ['start', 'center'] as const, 'start')).toBe('center');
    expect(option(s({ a: 'nope' }), 'a', ['start', 'center'] as const, 'start')).toBe('start');
  });
  it('lines splits, trims, and drops blanks', () => {
    expect(lines(s({ a: 'one\n  two \n\n three' }), 'a')).toEqual(['one', 'two', 'three']);
    expect(lines(s({}), 'a')).toEqual([]);
  });
});
