import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { catalogFor, ROUGE_CATALOG } from '../../content/demo';
import { sampleNewest, sampleProductDetail } from '../../dev/sampleData';
import { resolveSectionSettings } from '../../sections-lib/schema';
import type { ProductCardModel } from '../../types/catalog';
import { glowTheme, GLOW_SECTION_SCHEMAS } from './index';
import { contrast, createGlowTokens } from './create-tokens';
import { GLOW_PALETTES } from './tokens';
import { sizeLabel } from './components/size';
import { storeStats, glowResultsSchema } from './sections/Results';
import { glowHeroSchema } from './sections/Hero';
import { glowTrustSchema } from './sections/Trust';
import { sortProducts } from './sections/ProductRails';
import { announcementMessages } from './layouts/DefaultLayout';

const product = (over: Partial<ProductCardModel>): ProductCardModel => ({ id: 'x', handle: 'x', title: 'X', url: '/products/x', price: 10, currency: 'USD', ...over });

describe('Glow theme contract', () => {
  it('loads from the catalog and exports every template section through the backend contract', async () => {
    const entry = getCatalogEntry('glow')!;
    expect(entry).toBeDefined();
    expect(await entry.load()).toBe(glowTheme);
    const manifest = buildBackendManifest(glowTheme, entry);
    expect(manifest.key).toBe('glow');
    expect(manifest.category).toBe('beauty');
    expect(manifest.bundle_url).toBe('builtin:glow@1.0.0');
    for (const page of ['home', 'product', 'category']) expect(manifest.templates[page]?.sections.length).toBeGreaterThan(0);
    for (const page of Object.values(manifest.templates)) {
      for (const section of page.sections) {
        expect(glowTheme.sections?.[section.type], section.type).toBeDefined();
        expect(manifest.sections_schema[section.type], section.type).toBeDefined();
      }
    }
    for (const schema of GLOW_SECTION_SCHEMAS) expect(manifest.sections_schema[schema.type]).toBeDefined();
    expect(manifest.settings_schema.flatMap((g) => g.fields).map((f) => f.id)).toContain('palette');
  });

  it('has AR and EN defaults for every translatable field of its own sections', () => {
    for (const schema of GLOW_SECTION_SCHEMAS) {
      const ar = resolveSectionSettings(schema, {}, 'ar');
      const en = resolveSectionSettings(schema, {}, 'en');
      for (const field of schema.settings) {
        if (field.type === 'list' || !('translatable' in field) || !field.translatable) continue;
        const d = field.default;
        if (typeof d === 'object' && d !== null) {
          expect(ar[field.id], `${schema.type}.${field.id}`).not.toBe(en[field.id]);
        }
      }
    }
    expect(resolveSectionSettings(glowHeroSchema, {}, 'ar')['heading']).toBe('بشرة صحية تتوهّج من الداخل');
    expect(resolveSectionSettings(glowHeroSchema, {}, 'en')['heading']).toBe('Skin that glows from within');
  });

  it('never ships invented results: manual figures start empty and claims are opt-in toggles', () => {
    expect(resolveSectionSettings(glowResultsSchema, {}, 'en')['items']).toEqual([]);
    expect(resolveSectionSettings(glowResultsSchema, {}, 'en')['source']).toBe('auto');
    expect(resolveSectionSettings(glowTrustSchema, {}, 'en')['show_halal']).toBe(false);
    expect(storeStats([], 'en')).toEqual([]);
    const stats = storeStats([product({ rating: 5, reviewCount: 10 }), product({ id: 'y', rating: 4, reviewCount: 10 })], 'en');
    expect(stats[0]?.value).toBe('4.5/5');
    expect(stats[1]?.value).toBe('20');
    expect(stats[2]?.value).toBe('50%');
  });

  it('reads size / volume for the card', () => {
    expect(sizeLabel(product({ sizes: ['15ml', '30ml', '50ml'] }), 'en')).toBe('15 / 30 / 50 ml');
    expect(sizeLabel(product({ sizes: ['15ml', '30ml', '50ml'] }), 'ar')).toBe('15 / 30 / 50 مل');
    expect(sizeLabel(product({ sizes: ['Travel', 'Full size'] }), 'ar')).toBe('حجم السفر · الحجم الكامل');
    expect(sizeLabel(product({ variants: [{ id: 'a', label: '50 g', available: true, options: { Size: '50 g' } }] }), 'en')).toBe('50 g');
    expect(sizeLabel(product({}), 'en')).toBe('');
  });

  it('keeps every palette at WCAG AA for body and muted text', () => {
    for (const [id, c] of Object.entries(GLOW_PALETTES)) {
      expect(contrast(c.text, c.bg), `${id} text/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.muted, c.bg), `${id} muted/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.muted, c.surface2), `${id} muted/surface2`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.onPrimary, c.primary), `${id} onPrimary/primary`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.accentInk, c.bg), `${id} accentInk/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.sale, c.surface), `${id} sale/surface`).toBeGreaterThanOrEqual(4.5);
    }
    const night = createGlowTokens({ palette: 'night' });
    expect(night.color.light.bg).toBe(GLOW_PALETTES.night.bg);
    expect(createGlowTokens({ palette: 'blush' }).color.dark.bg).toBe(GLOW_PALETTES.blush.bg);
    expect(createGlowTokens({ palette: 'blush', auto_dark: true }).color.dark.bg).toBe(GLOW_PALETTES.night.bg);
    expect(createGlowTokens({ primary_color: '#F5E6E0' }).color.light.onPrimary).toBe('#1B1214');
  });

  it('sorts listings and splits announcements', () => {
    const list = [product({ id: 'a', price: 30, title: 'B' }), product({ id: 'b', price: 10, title: 'A', rating: 5 })];
    expect(sortProducts(list, 'price-asc').map((p) => p.id)).toEqual(['b', 'a']);
    expect(sortProducts(list, 'name').map((p) => p.id)).toEqual(['b', 'a']);
    expect(sortProducts(list, 'featured')).toBe(list);
    expect(announcementMessages(true, 'One | Two')).toEqual(['One', 'Two']);
    expect(announcementMessages(false, 'One')).toEqual([]);
    expect(announcementMessages(true, '', ['Store'])).toEqual(['Store']);
  });

  it('previews the rouge beauty catalogue in both languages with the template products present', () => {
    expect(catalogFor('glow')).toBe(ROUGE_CATALOG);
    const en = sampleNewest('glow', 'en');
    const ar = sampleNewest('glow', 'ar');
    expect(en.length).toBeGreaterThanOrEqual(16);
    expect(en[0]?.title).not.toBe(ar[0]?.title);
    expect(en[0]?.price).toBe(ar[0]?.price);
    for (const handle of ['rosewater-hydrating-essence', 'radiance-vitamin-c-serum', 'barrier-repair-moisturiser']) expect(en.some((p) => p.handle === handle), handle).toBe(true);
    const detail = sampleProductDetail('radiance-vitamin-c-serum', 'glow', 'en');
    expect(detail.variants?.map((v) => v.label)).toEqual(['15 ml', '30 ml', '50 ml']);
  });
});
