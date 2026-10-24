import { describe, expect, it } from 'vitest';
import { getCatalogEntry } from '../../platform/catalog/catalog';
import { buildBackendManifest } from '../../platform/export/theme-manifest-export';
import { sampleNewest, sampleProductDetail } from '../../dev/sampleData';
import { catalogFor } from '../../content/demo';
import { resolveSectionSettings } from '../../sections-lib/schema';
import { defaultSettings } from '../../theme-engine/settings';
import type { ProductCardModel } from '../../types/catalog';
import { STRIDE_SECTION_SCHEMAS, createStrideTokens, strideTheme } from './index';
import { strideSettingsSchema } from './settings';
import { strideHeroSchema } from './sections/Hero';
import { strideDropSchema } from './sections/DropCountdown';
import { DEFAULT_SIZE_ROWS, strideSizeGuideSchema, suggestSizeRow } from './sections/SizeGuide';
import { cardSwatches, isNewProduct, lowStockCount, stockLeft } from './components/card-model';
import { contrast, stridePalettes } from './palette';

const base = (over: Partial<ProductCardModel> = {}): ProductCardModel => ({ id: 'x', handle: 'x', title: 'X', url: '/products/x', price: 10, currency: 'USD', ...over });

describe('Stride theme contract', () => {
  it('is registered, loads, and exports every template section through the backend contract', async () => {
    const entry = getCatalogEntry('stride')!;
    expect(entry).toBeDefined();
    expect(await entry.load()).toBe(strideTheme);
    expect(strideTheme.manifest.category).toBe('sports');
    const manifest = buildBackendManifest(strideTheme, entry);
    expect(manifest.key).toBe('stride');
    expect(manifest.category).toBe('sports');
    expect(manifest.bundle_url).toBe('builtin:stride@1.0.0');
    for (const page of ['home', 'product', 'category']) expect(manifest.templates[page]?.sections.length).toBeGreaterThan(0);
    for (const page of Object.values(manifest.templates)) {
      for (const section of page.sections) {
        expect(strideTheme.sections?.[section.type], section.type).toBeDefined();
        expect(manifest.sections_schema[section.type], section.type).toBeDefined();
      }
    }
    for (const schema of STRIDE_SECTION_SCHEMAS) expect(manifest.sections_schema[schema.type]).toBeDefined();
    expect(manifest.sections_schema['stride-size-guide']?.settings.find((f) => f.id === 'rows')?.type).toBe('list');
  });

  it('renders signature defaults in both languages', () => {
    expect(resolveSectionSettings(strideHeroSchema, {}, 'en')['heading']).toBe('Run further');
    expect(resolveSectionSettings(strideHeroSchema, {}, 'ar')['heading']).toBe('اجرِ أبعد');
    expect(resolveSectionSettings(strideDropSchema, {}, 'en')['drop_label']).toBe('Drop 07');
    expect(resolveSectionSettings(strideDropSchema, {}, 'ar')['drop_label']).toBe('إصدار ٠٧');
    expect(resolveSectionSettings(strideSizeGuideSchema, {}, 'ar')['title']).toBe('اعرف مقاسك في ثواني');
    for (const schema of STRIDE_SECTION_SCHEMAS) {
      for (const field of schema.settings) {
        if (field.type === 'text' && typeof field.default === 'object' && field.default !== null) {
          const d = field.default as { ar?: string; en?: string };
          expect(d.ar, `${schema.type}.${field.id}`).toBeTruthy();
          expect(d.en, `${schema.type}.${field.id}`).toBeTruthy();
        }
      }
    }
  });

  it('keeps the demo catalogue facts identical across locales and gives the PDP a size run', () => {
    expect(catalogFor('stride', 'en').products.length).toBeGreaterThanOrEqual(16);
    const en = sampleNewest('stride', 'en');
    const ar = sampleNewest('stride', 'ar');
    expect(en[0]?.title).not.toBe(ar[0]?.title);
    expect(en[0]?.price).toBe(ar[0]?.price);
    const detail = sampleProductDetail(en[0]!.handle, 'stride', 'en');
    expect(detail.variants?.length).toBeGreaterThan(0);
    expect(detail.variants?.some((v) => v.available === false)).toBe(true);
  });
});

describe('Stride card model', () => {
  it('builds colour dots from swatches, else from variant colour options', () => {
    expect(cardSwatches(base({ colors: [{ value: 'b', label: 'Black', color: '#111' }, { value: 'b2', label: 'black', color: '#111' }] }))).toHaveLength(1);
    const fromVariants = cardSwatches(base({ variants: [
      { id: '1', label: 'Red / 42', available: true, options: { Color: 'Red', Size: '42' } },
      { id: '2', label: 'Blue / 42', available: false, options: { Color: 'Blue', Size: '42' } },
      { id: '3', label: 'Red / 43', available: true, options: { Color: 'Red', Size: '43' } },
    ] }));
    expect(fromVariants.map((s) => s.label)).toEqual(['Red', 'Blue']);
    expect(fromVariants[1]?.available).toBe(false);
    expect(cardSwatches(base())).toEqual([]);
  });

  it('flags new products and low stock only when the store exposes stock', () => {
    expect(isNewProduct(base({ badge: 'New' }))).toBe(true);
    expect(isNewProduct(base({ badge: 'جديد' }))).toBe(true);
    expect(isNewProduct(base({ badge: 'Save 20%' }))).toBe(false);
    expect(stockLeft(base())).toBeUndefined();
    expect(lowStockCount(base({ availableStock: 3 }), 5)).toBe(3);
    expect(lowStockCount(base({ availableStock: 9 }), 5)).toBeNull();
    expect(lowStockCount(base({ availableStock: 2, soldOut: true }), 5)).toBeNull();
    expect(lowStockCount(base({ variants: [{ id: 'a', label: 'a', available: true, availableStock: 1 }, { id: 'b', label: 'b', available: true, availableStock: 1 }] }), 5)).toBe(2);
    expect(lowStockCount(base({ variants: [{ id: 'a', label: 'a', available: true, availableStock: 1 }, { id: 'b', label: 'b', available: true }] }), 5)).toBeNull();
  });

  it('suggests the first chart row whose foot length covers the measurement', () => {
    expect(suggestSizeRow(DEFAULT_SIZE_ROWS, 26.2)).toBe(DEFAULT_SIZE_ROWS.findIndex((r) => r['cm'] === '26.5'));
    expect(suggestSizeRow(DEFAULT_SIZE_ROWS, 26)).toBe(DEFAULT_SIZE_ROWS.findIndex((r) => r['cm'] === '26'));
    expect(suggestSizeRow(DEFAULT_SIZE_ROWS, 40)).toBe(-1);
    expect(suggestSizeRow(DEFAULT_SIZE_ROWS, Number.NaN)).toBe(-1);
  });
});

describe('Stride palettes', () => {
  it('keeps body text, muted text and button ink at AA in every preset', () => {
    for (const color_scheme of ['dark', 'light', 'auto']) {
      for (const accent_preset of ['volt', 'red']) {
        const settings = { ...defaultSettings(strideSettingsSchema), color_scheme, accent_preset };
        const palettes = stridePalettes(settings);
        for (const p of [palettes.light, palettes.dark]) {
          expect(contrast(p.text, p.bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(p.accentInk, p.bg)).toBeGreaterThanOrEqual(4.5);
          expect(contrast(p.sale, p.surface)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('puts the chosen ground in both engine slots unless the merchant follows the device', () => {
    const dark = createStrideTokens({ ...defaultSettings(strideSettingsSchema), color_scheme: 'dark' });
    expect(dark.color.light.bg).toBe(dark.color.dark.bg);
    const auto = createStrideTokens({ ...defaultSettings(strideSettingsSchema), color_scheme: 'auto' });
    expect(auto.color.light.bg).not.toBe(auto.color.dark.bg);
    const custom = createStrideTokens({ ...defaultSettings(strideSettingsSchema), color_scheme: 'light', accent_preset: 'custom', accent_color: '#FFE600' });
    // A pale custom accent cannot carry button text on the light ground; buttons fall back to ink.
    expect(contrast(custom.color.light.onPrimary, custom.color.light.primary)).toBeGreaterThanOrEqual(4.5);
  });
});
