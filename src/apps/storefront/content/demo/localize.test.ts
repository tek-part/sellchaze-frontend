/**
 * Locale overlay invariants.
 *
 * The whole point of the overlay is that facts exist once and text exists twice. These pin that:
 * a price, image or id that drifts between languages is a data-integrity bug that no visual review
 * would reliably catch, and a swatch value that changes with language silently breaks shared
 * filter links.
 */
import { describe, expect, it } from 'vitest';
import { catalogFor } from './index';

const THEMES = ['luxury-fashion', 'rouge', 'hearth', 'voltage'] as const;
const ARABIC = /[؀-ۿ]/;

describe.each(THEMES)('%s catalogue localisation', (theme) => {
  const en = catalogFor(theme, 'en');
  const ar = catalogFor(theme, 'ar');

  it('keeps language-independent facts identical', () => {
    expect(ar.products).toHaveLength(en.products.length);
    en.products.forEach((product, i) => {
      const localized = ar.products[i]!;
      expect(localized.id).toBe(product.id);
      expect(localized.handle).toBe(product.handle);
      expect(localized.url).toBe(product.url);
      expect(localized.price).toBe(product.price);
      expect(localized.compareAtPrice).toBe(product.compareAtPrice);
      expect(localized.rating).toBe(product.rating);
      expect(localized.reviewCount).toBe(product.reviewCount);
      expect(localized.soldOut).toBe(product.soldOut);
      expect(localized.image?.src).toBe(product.image?.src);
    });
  });

  it('translates every product title', () => {
    for (const product of ar.products) {
      expect(ARABIC.test(product.title), product.title).toBe(true);
    }
  });

  it('translates category titles while preserving their slugs', () => {
    en.categories.forEach((category, i) => {
      const localized = ar.categories[i]!;
      // The slug is the route: translating it would break every shared link.
      expect(localized.url).toBe(category.url);
      expect(ARABIC.test(localized.title), localized.title).toBe(true);
    });
  });

  it('keeps colour swatch VALUES stable so filter links survive a language switch', () => {
    en.products.forEach((product, i) => {
      const localized = ar.products[i]!;
      (product.colors ?? []).forEach((swatch, j) => {
        expect(localized.colors?.[j]?.value).toBe(swatch.value);
        expect(localized.colors?.[j]?.color).toBe(swatch.color);
      });
    });
  });

  it('translates testimonials, FAQs and announcements', () => {
    for (const item of ar.testimonials) expect(ARABIC.test(item.quote)).toBe(true);
    for (const faq of ar.faqs) {
      expect(ARABIC.test(faq.question)).toBe(true);
      expect(ARABIC.test(faq.answer)).toBe(true);
    }
    for (const announcement of ar.announcements) expect(ARABIC.test(announcement)).toBe(true);
  });

  it('translates brand notes but keeps brand names as proper nouns', () => {
    en.brands.forEach((brand, i) => {
      expect(ar.brands[i]!.name).toBe(brand.name);
      expect(ARABIC.test(ar.brands[i]!.note), ar.brands[i]!.note).toBe(true);
    });
  });

  it('leaves English untouched', () => {
    expect(catalogFor(theme, 'en')).toBe(catalogFor(theme, 'en'));
    for (const product of en.products) expect(ARABIC.test(product.title)).toBe(false);
  });
});

describe('memoisation', () => {
  it('returns a stable reference per theme+locale', () => {
    // Downstream selectors (facets, sorting, filtering) memoise on this array identity; rebuilding
    // it every call would defeat them.
    expect(catalogFor('rouge', 'ar')).toBe(catalogFor('rouge', 'ar'));
    expect(catalogFor('rouge', 'ar')).not.toBe(catalogFor('hearth', 'ar'));
  });

  it('falls back to English for an unknown locale rather than throwing', () => {
    expect(catalogFor('rouge', 'fr')).toBe(catalogFor('rouge', 'en'));
  });
});
