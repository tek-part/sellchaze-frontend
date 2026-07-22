import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

/**
 * These run in the Vitest `node` environment (no DOMParser), so they exercise the safe-by-default
 * text-stripping fallback. The invariant under test is the security one: the output must contain no
 * executable markup — no live tag, no on* handler, no javascript: URL — even for entity-encoded
 * payloads (which must not be decoded back into markup). The browser DOMParser path is a strict
 * superset (allowlisted rebuild) and is exercised at runtime.
 */
describe('sanitizeHtml (security)', () => {
  const attacks = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg/onload=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
    '<iframe src="javascript:alert(1)"></iframe>',
    'plain &lt;script&gt;alert(1)&lt;/script&gt; encoded',
    '<body onload=alert(1)>',
  ];

  it('never emits a live opening tag or event handler', () => {
    for (const input of attacks) {
      const out = sanitizeHtml(input);
      // No live element tag (a literal "<" followed by a tag name).
      expect(/<[a-z!/]/i.test(out), `live tag survived: ${input} → ${out}`).toBe(false);
      expect(/on\w+\s*=/i.test(out), `handler survived: ${input} → ${out}`).toBe(false);
      expect(/javascript:/i.test(out), `js url survived: ${input} → ${out}`).toBe(false);
    }
  });

  it('does not decode entities back into markup', () => {
    const out = sanitizeHtml('&lt;img src=x onerror=alert(1)&gt;');
    expect(out.includes('<img')).toBe(false);
    expect(/<[a-z]/i.test(out)).toBe(false);
  });

  it('is empty-safe', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('preserves visible text content', () => {
    expect(sanitizeHtml('<p>Hello <strong>world</strong></p>')).toContain('Hello');
    expect(sanitizeHtml('<p>Hello <strong>world</strong></p>')).toContain('world');
  });
});
