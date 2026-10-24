import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { resolveSectionSettings } from '../../sections-lib/schema';
import { sampleNewest } from '../../dev/sampleData';
import { catalogFor } from '../../content/demo';
import { defaultSettings } from '../../theme-engine/settings';
import { maisonTheme, MAISON_SECTION_SCHEMAS, createMaisonTokens, luminance } from './index';
import { maisonSettingsSchema } from './settings';
import { maisonHeroSchema } from './sections/Hero';
import { maisonShopTheRoomSchema } from './sections/ShopTheRoom';
import { maisonGiftGuideSchema, bandLabel } from './sections/GiftGuide';
import { maisonRoomsSchema } from './sections/Rooms';
import { parsePalette } from './sections/Moodboard';
import { cardMetaLine, dimensionFromTitle } from './components/card-meta';

const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('Maison theme contract', () => {
  it('loads through the catalog and exports every template section through the backend contract', async () => {
    const entry = getCatalogEntry('maison')!;
    expect(entry).toBeDefined();
    expect(await entry.load()).toBe(maisonTheme);
    const manifest = buildBackendManifest(maisonTheme, entry);
    expect(manifest.key).toBe('maison');
    expect(manifest.category).toBe('home-decor');
    expect(manifest.bundle_url).toBe('builtin:maison@1.0.0');
    for (const name of ['home', 'product', 'category'] as const) {
      const page = manifest.templates[name];
      expect(page?.sections.length).toBeGreaterThan(0);
      for (const section of page!.sections) {
        expect(maisonTheme.sections?.[section.type], section.type).toBeDefined();
        expect(manifest.sections_schema[section.type], section.type).toBeDefined();
      }
    }
    for (const schema of MAISON_SECTION_SCHEMAS) expect(manifest.sections_schema[schema.type]?.label).toBe(schema.label);
    expect(manifest.sections_schema['maison-shop-the-room']?.settings.find((f) => f.id === 'hotspots')?.type).toBe('list');
    const groups = manifest.settings_schema.map((g) => g.label);
    expect(groups).toEqual(expect.arrayContaining(['Colors', 'Typography', 'Header', 'Layout', 'Product cards']));
  });

  it('localizes every signature section default in Arabic and English', () => {
    for (const schema of MAISON_SECTION_SCHEMAS) {
      const ar = resolveSectionSettings(schema, {}, 'ar');
      const en = resolveSectionSettings(schema, {}, 'en');
      const titleKey = schema.settings.some((f) => f.id === 'title') ? 'title' : 'eyebrow';
      expect(typeof en[titleKey]).toBe('string');
      expect(en[titleKey], schema.type).not.toBe('');
      expect(ar[titleKey], schema.type).not.toBe(en[titleKey]);
      expect(String(ar[titleKey])).toMatch(/[؀-ۿ]/);
    }
    expect(resolveSectionSettings(maisonHeroSchema, {}, 'en')['title']).toBe('Make it warm, make it yours');
    const rooms = resolveSectionSettings(maisonRoomsSchema, {}, 'ar')['rooms'] as ReadonlyArray<Record<string, unknown>>;
    expect(rooms.map((r) => r['room'])).toEqual(['living', 'bedroom', 'kitchen', 'bath', 'outdoor']);
    expect(String(rooms[0]!['title'])).toMatch(/[؀-ۿ]/);
    const spots = resolveSectionSettings(maisonShopTheRoomSchema, {}, 'en')['hotspots'] as ReadonlyArray<Record<string, unknown>>;
    expect(spots.length).toBeGreaterThan(0);
    for (const s of spots) {
      expect(Number(s['x'])).toBeGreaterThanOrEqual(0);
      expect(Number(s['x'])).toBeLessThanOrEqual(100);
    }
    expect((resolveSectionSettings(maisonGiftGuideSchema, {}, 'en')['bands'] as ReadonlyArray<unknown>).length).toBe(4);
  });

  it('builds AA-contrast tokens for both palette presets and honours colour overrides', () => {
    for (const palette of ['terracotta', 'olive']) {
      const tokens = createMaisonTokens({ ...defaultSettings(maisonSettingsSchema), palette });
      const c = tokens.color.light;
      expect(contrast(c.onPrimary, c.primary), `${palette} on-primary`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.text, c.bg), `${palette} text`).toBeGreaterThanOrEqual(7);
      expect(contrast(c.muted, c.bg), `${palette} muted`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.accentInk, c.bg), `${palette} accent ink`).toBeGreaterThanOrEqual(4.5);
      const d = tokens.color.dark;
      expect(contrast(d.onPrimary, d.primary), `${palette} dark on-primary`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(d.muted, d.bg), `${palette} dark muted`).toBeGreaterThanOrEqual(4.5);
    }
    expect(maisonTheme.tokens.typography.fontSerif).toContain('Cormorant Garamond');
    expect(maisonTheme.tokens.typography.fontSans).toContain('IBM Plex Sans Arabic');
    const custom = createMaisonTokens({ ...defaultSettings(maisonSettingsSchema), primary_color: '#F2D16B', radius: 'crisp', container_width: 1400 });
    expect(custom.color.light.primary).toBe('#F2D16B');
    expect(contrast(custom.color.light.onPrimary, '#F2D16B')).toBeGreaterThanOrEqual(4.5);
    expect(custom.radius.base).toBe('6px');
    expect(custom.spacing.container).toBe('1400px');
    expect(createMaisonTokens({ primary_color: 'not-a-colour' }).color.light.primary).toBe('#B0533A');
  });

  it('writes card meta and gift labels only from real product facts', () => {
    expect(dimensionFromTitle('Handwoven Wool Rug — 200×300')).toBe('200×300');
    expect(dimensionFromTitle('Linen runner 45 x 180 cm')).toBe('45×180 cm');
    expect(dimensionFromTitle('طاولة طعام من خشب البلوط — 200 سم')).toBe('200 سم');
    expect(dimensionFromTitle('Ceramic Table Lamp — Clay')).toBe('');
    expect(cardMetaLine({ title: 'Jute Basket', material: 'Jute' })).toBe('Jute');
    expect(cardMetaLine({ title: 'Plain Vase' })).toBe('');
    expect(bandLabel(0, 200, 'EGP', 'en')).toContain('Under');
    expect(bandLabel(1200, 0, 'EGP', 'ar')).toContain('فأكثر');
    expect(parsePalette('#B0533A, nope, #fff،#123456')).toEqual(['#B0533A', '#fff', '#123456']);
  });

  it('previews the hearth home catalogue in both languages with identical facts', () => {
    expect(catalogFor('maison', 'en')).toBe(catalogFor('naseem', 'en'));
    const en = sampleNewest('maison', 'en');
    const ar = sampleNewest('maison', 'ar');
    expect(en.length).toBeGreaterThan(8);
    expect(en[0]?.title).not.toBe(ar[0]?.title);
    expect(en[0]?.price).toBe(ar[0]?.price);
  });
});
