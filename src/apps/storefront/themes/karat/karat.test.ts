import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { sampleNewest } from '../../dev/sampleData';
import { LUXURY_CATALOG, catalogFor } from '../../content/demo';
import { resolveSectionSettings } from '../../sections-lib/schema';
import type { ProductCardModel } from '../../types/catalog';
import { KARAT_SECTION_SCHEMAS, createKaratTokens, karatTheme } from './index';
import { karatHeroSchema } from './sections/Hero';
import { karatRateNoticeSchema } from './sections/RateNotice';
import { karatCraftSchema } from './sections/Craft';
import { karatGiftFinderSchema } from './sections/GiftFinder';
import { jewelSpecs, specLine } from './components/specs';
import { whatsappHref } from './components/i18n';
import { KARAT_PALETTES } from './tokens';

const product = (extra: Partial<ProductCardModel>): ProductCardModel => ({ id: 'p1', handle: 'ring', title: 'Ring', url: '/products/ring', price: 100, currency: 'EGP', ...extra });

describe('Karat theme contract', () => {
  it('loads from the catalog and exports every template section through the backend contract', async () => {
    const entry = getCatalogEntry('karat')!;
    expect(entry).toBeDefined();
    expect(await entry.load()).toBe(karatTheme);
    const manifest = buildBackendManifest(karatTheme, entry);
    expect(manifest.key).toBe('karat');
    expect(manifest.category).toBe('jewelry');
    expect(manifest.bundle_url).toBe('builtin:karat@1.0.0');
    for (const name of ['home', 'product', 'category']) expect(manifest.templates[name]?.sections.length).toBeGreaterThan(0);
    for (const page of Object.values(manifest.templates)) {
      for (const section of page.sections) {
        expect(karatTheme.sections?.[section.type], section.type).toBeDefined();
        expect(manifest.sections_schema[section.type], section.type).toBeDefined();
      }
    }
    for (const schema of KARAT_SECTION_SCHEMAS) expect(manifest.sections_schema[schema.type]?.label).toBe(schema.label);
  });

  it('ships bilingual defaults for the signature sections', () => {
    expect(resolveSectionSettings(karatHeroSchema, {}, 'ar')['heading']).toBe('قطعٌ تُورَّث جيلاً بعد جيل');
    expect(resolveSectionSettings(karatHeroSchema, {}, 'en')['heading']).toBe('Pieces made to be inherited');
    const gifts = resolveSectionSettings(karatGiftFinderSchema, {}, 'ar');
    expect(gifts['her_label']).toBe('لها');
    expect((gifts['budget_links'] as ReadonlyArray<Record<string, unknown>>)[0]?.['label']).toBe('لمسات رقيقة');
    const craft = resolveSectionSettings(karatCraftSchema, {}, 'en');
    expect((craft['items'] as ReadonlyArray<Record<string, unknown>>).map((i) => i['enabled'])).toEqual([true, true, true, true]);
  });

  it('never ships invented gold rates', () => {
    for (const locale of ['ar', 'en']) {
      const s = resolveSectionSettings(karatRateNoticeSchema, {}, locale);
      expect(s['rates']).toEqual([]);
      expect(s['updated']).toBe('');
      expect(String(s['message'])).not.toMatch(/\d/);
    }
    const home = karatTheme.templates?.['home']?.sections.find((section) => section.type === 'karat-rate-notice');
    expect(home?.settings ?? {}).not.toHaveProperty('rates');
  });

  it('maps each palette preset to the same light and dark tokens and honours a gold override', () => {
    for (const palette of ['emerald', 'onyx', 'ivory'] as const) {
      const tokens = createKaratTokens({ ...karatTheme.defaultSettings, palette });
      expect(tokens.color.light).toEqual(KARAT_PALETTES[palette]);
      expect(tokens.color.dark).toEqual(KARAT_PALETTES[palette]);
    }
    const gold = createKaratTokens({ ...karatTheme.defaultSettings, accent_color: '#E0C27A' });
    expect(gold.color.light.accent).toBe('#E0C27A');
    expect(gold.color.light.primary).toBe('#E0C27A');
    expect(createKaratTokens({ ...karatTheme.defaultSettings, accent_color: 'red' }).color.light.accent).toBe(KARAT_PALETTES.emerald.accent);
    expect(karatTheme.tokens.typography.fontSerif).toContain('Cormorant Garamond');
    expect(karatTheme.tokens.typography.fontSerif).toContain('IBM Plex Sans Arabic');
  });

  it('reads metal, karat and weight only from data the product carries', () => {
    expect(specLine(jewelSpecs(product({})))).toEqual([]);
    const ring = product({ variants: [
      { id: 'v1', label: '52', available: true, options: { Metal: 'Yellow gold', Karat: '18K', Weight: '3.4 g' } },
      { id: 'v2', label: '54', available: true, options: { Metal: 'Yellow gold', Karat: '21K', Weight: '3.6 g' } },
    ] });
    expect(specLine(jewelSpecs(ring))).toEqual(['18K / 21K', 'Yellow gold', '3.4 g / 3.6 g']);
    const arabic = product({ variants: [{ id: 'v1', label: 'a', available: true, options: { 'العيار': '٢١', 'الوزن': '٥ جم' } }] });
    expect(jewelSpecs(arabic)).toEqual({ karat: '٢١', weight: '٥ جم' });
    const tagged = product({ material: '18K Gold', tags: ['18k', '4,2g'] });
    expect(specLine(jewelSpecs(tagged))).toEqual(['18K Gold', '4.2 g']);
  });

  it('builds WhatsApp links only from a real number', () => {
    expect(whatsappHref('')).toBe('');
    expect(whatsappHref('+20 1000')).toBe('');
    expect(whatsappHref('+20 100 123 4567', 'Hi there')).toBe('https://wa.me/201001234567?text=Hi%20there');
  });

  it('previews with the luxury demo catalogue in both languages', () => {
    expect(catalogFor('karat')).toBe(LUXURY_CATALOG);
    const en = sampleNewest('karat', 'en');
    const ar = sampleNewest('karat', 'ar');
    expect(en.length).toBeGreaterThanOrEqual(12);
    expect(en[0]?.price).toBe(ar[0]?.price);
    expect(en[0]?.title).not.toBe(ar[0]?.title);
  });
});
