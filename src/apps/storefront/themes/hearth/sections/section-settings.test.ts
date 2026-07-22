import { describe, expect, it } from 'vitest';
import { count, flag, lines, option, pairs, range, text } from './section-settings';
import type { ThemeSettings } from '../../../theme-engine/types';

const settings: ThemeSettings = {
  heading: 'Rooms made to live in',
  sticky: true,
  columns: 4,
  align: 'center',
  items: 'Free delivery | Over $150\nEasy returns | 30 days\n\n  ',
};

describe('hearth section-settings readers', () => {
  it('text falls back when missing or wrong type', () => {
    expect(text(settings, 'heading')).toBe('Rooms made to live in');
    expect(text(settings, 'missing', 'fb')).toBe('fb');
    expect(text(settings, 'columns', 'fb')).toBe('fb');
  });

  it('flag / count coerce by type', () => {
    expect(flag(settings, 'sticky')).toBe(true);
    expect(flag(settings, 'missing', true)).toBe(true);
    expect(count(settings, 'columns', 1)).toBe(4);
    expect(count(settings, 'heading', 2)).toBe(2);
  });

  it('range clamps to [min, max]', () => {
    expect(range(settings, 'columns', 3, 1, 3)).toBe(3);
    expect(range(settings, 'missing', 10, 1, 6)).toBe(6);
    expect(range(settings, 'columns', 3, 2, 5)).toBe(4);
  });

  it('option restricts to the allowed set', () => {
    expect(option(settings, 'align', ['start', 'center'] as const, 'start')).toBe('center');
    expect(option(settings, 'align', ['start', 'end'] as const, 'start')).toBe('start');
  });

  it('lines drops blanks; pairs splits on the first pipe', () => {
    expect(lines(settings, 'items')).toEqual(['Free delivery | Over $150', 'Easy returns | 30 days']);
    expect(pairs(settings, 'items')).toEqual([
      { term: 'Free delivery', definition: 'Over $150' },
      { term: 'Easy returns', definition: '30 days' },
    ]);
  });
});
