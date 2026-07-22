/**
 * The newsletter hook exists to stop themes claiming a subscription that never happened, so the
 * validation boundary and the local-persistence contract are pinned here.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { isValidEmail, pendingSubscribers } from './useNewsletter';

describe('isValidEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isValidEmail('someone@example.com')).toBe(true);
    expect(isValidEmail('first.last+tag@sub.example.co.uk')).toBe(true);
    expect(isValidEmail('  spaced@example.com  ')).toBe(true);
  });

  it('rejects malformed addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('no-at-sign')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('two@@example.com')).toBe(false);
    expect(isValidEmail('spaces in@example.com')).toBe(false);
  });

  it('rejects addresses beyond the practical length limit', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@example.com`)).toBe(false);
  });
});

/**
 * The suite runs under node, where `localStorage` is genuinely absent — the same condition as SSR.
 * A minimal stub is installed per test so both branches are covered: with storage, and (in the last
 * case) without it, which must degrade to an empty list rather than throwing during a server render.
 */
const KEY = 'sf:newsletter:pending';

function installStorage(seed?: string): void {
  const map = new Map<string, string>();
  if (seed !== undefined) map.set(KEY, seed);
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  };
}

describe('pendingSubscribers', () => {
  beforeEach(() => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });

  it('returns an empty list when nothing has been captured', () => {
    installStorage();
    expect(pendingSubscribers()).toEqual([]);
  });

  it('survives corrupt storage rather than throwing', () => {
    installStorage('{not json');
    expect(pendingSubscribers()).toEqual([]);
  });

  it('ignores non-string entries', () => {
    installStorage(JSON.stringify(['a@b.com', 42, null]));
    expect(pendingSubscribers()).toEqual(['a@b.com']);
  });

  it('returns an empty list when storage is unavailable (SSR)', () => {
    expect(pendingSubscribers()).toEqual([]);
  });
});
