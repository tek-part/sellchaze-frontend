/**
 * Demo catalogues are shipped data that drives every preview, so their invariants are pinned here.
 * The important one is distinctness: the whole point of this module is that four themes stopped
 * sharing one fashion catalogue, and a copy-paste regression would silently undo that.
 */
import { describe, expect, it } from 'vitest';
import { catalogFor, HEARTH_CATALOG, LUXURY_CATALOG, ROUGE_CATALOG, VOLTAGE_CATALOG } from './index';

const ALL = [
  ['luxury-fashion', LUXURY_CATALOG],
  ['rouge', ROUGE_CATALOG],
  ['hearth', HEARTH_CATALOG],
  ['voltage', VOLTAGE_CATALOG],
] as const;

describe('catalogFor', () => {
  it('resolves each theme to its own catalogue', () => {
    for (const [id, expected] of ALL) expect(catalogFor(id)).toBe(expected);
  });

  it('falls back for an unknown or missing theme rather than throwing', () => {
    expect(catalogFor('does-not-exist')).toBe(LUXURY_CATALOG);
    expect(catalogFor(undefined)).toBe(LUXURY_CATALOG);
  });
});

describe('catalogue shape', () => {
  it.each(ALL)('%s is richly populated', (_id, cat) => {
    expect(cat.products.length).toBeGreaterThanOrEqual(16);
    expect(cat.categories.length).toBeGreaterThanOrEqual(12);
    expect(cat.brands.length).toBeGreaterThanOrEqual(12);
    expect(cat.testimonials.length).toBeGreaterThanOrEqual(8);
    expect(cat.faqs.length).toBeGreaterThanOrEqual(12);
    expect(cat.announcements.length).toBeGreaterThanOrEqual(3);
  });

  it.each(ALL)('%s has unique product ids, handles and category slugs', (_id, cat) => {
    const ids = cat.products.map((p) => p.id);
    const handles = cat.products.map((p) => p.handle);
    const urls = cat.categories.map((c) => c.url);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(handles).size).toBe(handles.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it.each(ALL)('%s uses verified https imagery with alt text', (_id, cat) => {
    for (const p of cat.products) {
      expect(p.image).toBeDefined();
      expect(p.image?.src).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect((p.image?.alt ?? '').length).toBeGreaterThan(0);
    }
    for (const c of cat.categories) expect(c.image?.src).toMatch(/^https:\/\/images\.unsplash\.com\//);
  });

  it.each(ALL)('%s prices and ratings are sane', (_id, cat) => {
    for (const p of cat.products) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.rating ?? 0).toBeGreaterThan(0);
      expect(p.rating ?? 0).toBeLessThanOrEqual(5);
      // A strike-through price that is not actually higher is a dark pattern, not a discount.
      if (p.compareAtPrice) expect(p.compareAtPrice).toBeGreaterThan(p.price);
    }
  });

  it.each(ALL)('%s testimonials carry a rating in range', (_id, cat) => {
    for (const t of cat.testimonials) {
      expect(t.rating).toBeGreaterThanOrEqual(1);
      expect(t.rating).toBeLessThanOrEqual(5);
      expect(t.quote.length).toBeGreaterThan(20);
    }
  });

  it.each(ALL)('%s contains no placeholder copy', (_id, cat) => {
    const text = JSON.stringify(cat).toLowerCase();
    for (const banned of ['lorem', 'ipsum', 'placeholder', 'dummy', 'sample text', 'todo']) {
      expect(text).not.toContain(banned);
    }
  });
});

describe('themes are actually distinct', () => {
  it('shares no product titles between any two catalogues', () => {
    for (const [idA, a] of ALL) {
      for (const [idB, b] of ALL) {
        if (idA >= idB) continue;
        const overlap = a.products.map((p) => p.title).filter((t) => b.products.some((p) => p.title === t));
        expect(overlap).toEqual([]);
      }
    }
  });

  it('gives every theme its own vertical label and brand roster', () => {
    const verticals = ALL.map(([, c]) => c.vertical);
    expect(new Set(verticals).size).toBe(ALL.length);
    for (const [idA, a] of ALL) {
      for (const [idB, b] of ALL) {
        if (idA >= idB) continue;
        const shared = a.brands.map((x) => x.name).filter((n) => b.brands.some((y) => y.name === n));
        expect(shared).toEqual([]);
      }
    }
  });
});
