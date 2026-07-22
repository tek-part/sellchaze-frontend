import { describe, expect, it } from 'vitest';
import { cn } from './cn';
import { callAll } from './callAll';

describe('cn', () => {
  it('joins truthy strings and skips falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });
  it('applies object maps by truthiness', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });
  it('returns empty string for no truthy values', () => {
    expect(cn(false, null, undefined)).toBe('');
  });
});

describe('callAll', () => {
  it('invokes every handler with the event, skipping undefined', () => {
    const calls: number[] = [];
    const merged = callAll<number>((n) => calls.push(n), undefined, (n) => calls.push(n * 2));
    merged(3);
    expect(calls).toEqual([3, 6]);
  });
});
