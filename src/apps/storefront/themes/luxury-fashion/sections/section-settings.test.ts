import { describe, expect, it } from 'vitest';
import { count, flag, lines, option, pairs, range, text } from './section-settings';
import type { ThemeSettings } from '../../../theme-engine/types';

const settings: ThemeSettings = {
  heading: 'Hello',
  featured: true,
  columns: 4,
  align: 'center',
  items: 'One | first\nTwo | second\n\n  ',
};

describe('section-settings readers', () => {
  it('text falls back when missing or wrong type', () => {
    expect(text(settings, 'heading')).toBe('Hello');
    expect(text(settings, 'missing', 'fb')).toBe('fb');
    expect(text(settings, 'columns', 'fb')).toBe('fb');
  });

  it('flag / count coerce by type', () => {
    expect(flag(settings, 'featured')).toBe(true);
    expect(flag(settings, 'missing', true)).toBe(true);
    expect(count(settings, 'columns', 1)).toBe(4);
    expect(count(settings, 'heading', 2)).toBe(2);
  });

  it('range clamps to bounds', () => {
    expect(range(settings, 'columns', 3, 1, 3)).toBe(3);
    expect(range(settings, 'missing', 10, 1, 6)).toBe(6);
  });

  it('option restricts to allowed values', () => {
    expect(option(settings, 'align', ['start', 'center', 'end'] as const, 'start')).toBe('center');
    expect(option(settings, 'missing', ['start', 'center'] as const, 'start')).toBe('start');
  });

  it('lines / pairs parse multiline list settings and drop blanks', () => {
    expect(lines(settings, 'items')).toEqual(['One | first', 'Two | second']);
    expect(pairs(settings, 'items')).toEqual([
      { term: 'One', definition: 'first' },
      { term: 'Two', definition: 'second' },
    ]);
  });
});
