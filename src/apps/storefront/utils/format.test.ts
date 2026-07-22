import { describe, expect, it } from 'vitest';
import { formatMoney, formatReadingTime } from './format';

describe('formatMoney', () => {
  it('formats currency in a stable locale', () => {
    expect(formatMoney(180, 'USD', 'en-US')).toBe('$180.00');
    expect(formatMoney(1999.5, 'USD', 'en-US')).toBe('$1,999.50');
  });
});

describe('formatReadingTime', () => {
  it('renders minutes or null', () => {
    expect(formatReadingTime(5)).toBe('5 min read');
    expect(formatReadingTime(0)).toBeNull();
    expect(formatReadingTime(undefined)).toBeNull();
  });
});
