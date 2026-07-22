/**
 * The error channel is the fix for the audit's most widespread defect: no section in any theme
 * could represent a failed fetch, so an API error rendered a silently blank region. These pin the
 * reader contract sections depend on to tell "failed" apart from "empty".
 */
import { describe, expect, it } from 'vitest';
import type { StorefrontContext } from '../../../theme-engine/rendering';
import { errorMessage, hasError, isLoading } from './section-data';

const ctx = (data: Record<string, unknown>): StorefrontContext =>
  ({ store: { name: 'S', currency: 'USD' }, seo: {}, navigation: { header: [], footer: [] }, data }) as StorefrontContext;

describe('hasError', () => {
  it('is false for a healthy context', () => {
    expect(hasError(ctx({ products: [] }))).toBe(false);
  });

  it('is false when error is explicitly null or undefined', () => {
    expect(hasError(ctx({ error: null }))).toBe(false);
    expect(hasError(ctx({ error: undefined }))).toBe(false);
  });

  it('is true for an Error, a string, or any other non-null value', () => {
    expect(hasError(ctx({ error: new Error('boom') }))).toBe(true);
    expect(hasError(ctx({ error: 'Request failed' }))).toBe(true);
    expect(hasError(ctx({ error: { status: 500 } }))).toBe(true);
  });

  it('distinguishes a failure from an empty result set', () => {
    const empty = ctx({ products: [] });
    const failed = ctx({ products: [], error: new Error('network') });
    expect(hasError(empty)).toBe(false);
    expect(hasError(failed)).toBe(true);
    // Both look identical to the loading reader — which is exactly why the error channel is needed.
    expect(isLoading(empty)).toBe(isLoading(failed));
  });
});

describe('errorMessage', () => {
  it('prefers a string error', () => {
    expect(errorMessage(ctx({ error: 'Upstream timed out' }))).toBe('Upstream timed out');
  });

  it('uses an Error message', () => {
    expect(errorMessage(ctx({ error: new Error('Network request failed') }))).toBe('Network request failed');
  });

  it('falls back to a calm generic line for blank or opaque errors', () => {
    expect(errorMessage(ctx({ error: '   ' }))).toMatch(/couldn’t load/i);
    expect(errorMessage(ctx({ error: { status: 500 } }))).toMatch(/couldn’t load/i);
    expect(errorMessage(ctx({ error: new Error('') }))).toMatch(/couldn’t load/i);
  });
});
