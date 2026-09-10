import { describe, expect, it } from 'vitest';
import { createSectionMap, libraryDefaultsFor, mergeSectionSchemas, SECTION_LIBRARY, sectionSchemaFor, unwrapSection } from './index';
import { blocksOf, resolveBlocks, resolveSectionSettings, variantOf } from './schema';
import { baseTemplates, DEFAULT_HOME_SECTIONS } from './templates';

const REQUIRED_TYPES = [
  'hero-slider', 'hero-banner', 'announcement-strip', 'category-circles', 'category-grid', 'featured-products',
  'product-tabs', 'flash-deals', 'banner-grid', 'image-with-text', 'video', 'rich-text', 'features', 'testimonials',
  'brand-logos', 'newsletter', 'faq', 'blog-posts', 'instagram', 'custom-html', 'spacer',
  'category-header', 'product-grid', 'product-details', 'related-products', 'recently-viewed',
  'multicolumn', 'image-gallery', 'collage', 'countdown-banner', 'contact-form', 'trust-badges', 'icon-list', 'text-with-buttons',
];

describe('SECTION_LIBRARY', () => {
  it('ships every contract section type with a unique kebab-case key and a category', () => {
    const types = SECTION_LIBRARY.map((s) => s.type);
    for (const t of REQUIRED_TYPES) expect(types).toContain(t);
    expect(new Set(types).size).toBe(types.length);
    for (const s of SECTION_LIBRARY) {
      expect(s.type).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.label.length).toBeGreaterThan(0);
      expect(['hero', 'products', 'categories', 'content', 'marketing', 'social', 'layout']).toContain(s.category);
    }
  });

  it('has unique field ids per section, list items without nested lists, and valid select defaults', () => {
    for (const s of SECTION_LIBRARY) {
      const ids = s.settings.map((f) => f.id);
      expect(new Set(ids).size, s.type).toBe(ids.length);
      for (const f of s.settings) {
        if (f.type === 'select') expect(f.options.some((o) => o.value === f.default), `${s.type}.${f.id}`).toBe(true);
        if (f.type === 'list') {
          for (const item of f.item) {
            expect(item.type, `${s.type}.${f.id}.${item.id}`).not.toBe('list');
            if (item.type === 'select') expect(item.options.some((o) => o.value === item.default)).toBe(true);
          }
          for (const row of f.default) for (const key of Object.keys(row)) expect(f.item.some((i) => i.id === key), `${s.type}.${f.id} default key ${key}`).toBe(true);
        }
      }
    }
  });

  it('declares valid variants and blocks (contract §7)', () => {
    for (const s of SECTION_LIBRARY) {
      if (s.variants) {
        const field = s.settings.find((f) => f.id === s.variants!.field);
        expect(field?.type, `${s.type}.variants.field`).toBe('select');
        for (const o of s.variants.options) {
          expect(o.label.length).toBeGreaterThan(0);
          expect(field && field.type === 'select' && field.options.some((x) => x.value === o.value), `${s.type} variant ${o.value}`).toBe(true);
        }
        expect(s.variants.options.some((o) => o.value === variantOf(s, {}))).toBe(true);
      }
      for (const b of blocksOf(s)) {
        expect(b.type).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
        const ids = b.settings.map((f) => f.id);
        expect(new Set(ids).size, `${s.type}.${b.type}`).toBe(ids.length);
        for (const f of b.settings) expect(f.type).not.toBe('list');
      }
      if (s.blocks?.legacy) {
        const legacy = s.settings.find((f) => f.id === s.blocks!.legacy);
        expect(legacy?.type, `${s.type}.blocks.legacy`).toBe('list');
        // Legacy list defaults render as blocks when a section has no `blocks` yet.
        if (legacy && legacy.type === 'list' && legacy.default.length > 0) {
          expect(resolveBlocks(s, {}).length).toBe(legacy.default.length);
        }
      }
    }
  });

  it('resolves empty settings to defaults in both languages without throwing', () => {
    for (const s of SECTION_LIBRARY) {
      const en = resolveSectionSettings(s, {}, 'en');
      const ar = resolveSectionSettings(s, undefined, 'ar');
      expect(Object.keys(en).sort()).toEqual(s.settings.map((f) => f.id).sort());
      for (const f of s.settings) {
        if (f.type === 'text' && f.translatable && typeof f.default === 'object') {
          expect(en[f.id]).toBe(f.default['en']);
          expect(ar[f.id]).toBe(f.default['ar']);
        }
      }
    }
  });
});

describe('createSectionMap / helpers', () => {
  it('maps every library type to a framed component and lets a theme override', () => {
    const Custom = (): null => null;
    const map = createSectionMap({ 'hero-slider': Custom, 'my-theme-thing': Custom });
    for (const s of SECTION_LIBRARY) expect(typeof map[s.type]).toBe('function');
    // Every entry (overrides included) is wrapped in the SectionFrame; the wrapper is memoised.
    expect(unwrapSection(map['hero-slider']!)).toBe(Custom);
    expect(unwrapSection(map['my-theme-thing']!)).toBe(Custom);
    expect(map['hero-slider']).not.toBe(Custom);
    expect(createSectionMap({ 'hero-slider': Custom })['hero-slider']).toBe(map['hero-slider']);
    expect(createSectionMap()['faq']).toBe(map['faq']);
  });

  it('exposes schema and defaults lookups', () => {
    expect(sectionSchemaFor('faq')?.label).toBe('FAQ');
    expect(sectionSchemaFor('nope')).toBeUndefined();
    expect(libraryDefaultsFor('nope')).toEqual({});
    expect(libraryDefaultsFor('featured-products', 'ar')['title']).toBe('وصل حديثاً');
    const merged = mergeSectionSchemas([{ type: 'faq', label: 'Custom FAQ', category: 'content', settings: [] }]);
    expect(merged.find((s) => s.type === 'faq')?.label).toBe('Custom FAQ');
    expect(merged.length).toBe(SECTION_LIBRARY.length);
  });
});

describe('baseTemplates', () => {
  it('builds home/product/category from library types only', () => {
    const tpl = baseTemplates();
    const known = new Set(SECTION_LIBRARY.map((s) => s.type));
    for (const name of ['home', 'product', 'category']) {
      for (const inst of tpl[name]!.sections) expect(known.has(inst.type), `${name}:${inst.type}`).toBe(true);
    }
    expect(tpl['home']!.sections).toBe(DEFAULT_HOME_SECTIONS);
    expect(baseTemplates({ home: [{ type: 'rich-text' }], extra: { cart: { template: 'cart', sections: [] } } })['cart']).toBeDefined();
  });
});
