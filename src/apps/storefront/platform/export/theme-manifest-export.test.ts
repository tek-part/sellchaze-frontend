import { describe, expect, it } from 'vitest';
import type { ThemeModule, ThemeSettingsSchema } from '../../theme-engine/types';
import { buildBackendManifest, fieldToJson, groupSettingsSchema, toSectionsSchema, toTemplates } from './theme-manifest-export';

const schema: ThemeSettingsSchema = [
  { id: 'primary_color', type: 'color', label: 'Primary', group: 'Colors', default: '#1D4ED8' },
  { id: 'heading_font', type: 'select', label: 'Heading font', group: 'Typography', options: [{ value: 'Cairo', label: 'Cairo' }], default: 'Cairo' },
  { id: 'container_width', type: 'range', label: 'Width', group: 'Layout', min: 1200, max: 1600, step: 20, default: 1320, help: 'legacy help' },
  { id: 'announcement_text', type: 'text', label: 'Announcement', group: 'Layout', translatable: true, default: { ar: 'أهلاً', en: 'Hello' } },
  { id: 'loose', type: 'toggle', label: 'Loose', default: true },
];

describe('groupSettingsSchema', () => {
  it('folds flat fields into groups by first appearance and maps help → hint', () => {
    const groups = groupSettingsSchema(schema);
    expect(groups.map((g) => g.id)).toEqual(['colors', 'typography', 'layout', 'general']);
    expect(groups[2]?.fields.map((f) => f.id)).toEqual(['container_width', 'announcement_text']);
    expect(groups[2]?.fields[0]).toMatchObject({ min: 1200, max: 1600, step: 20, hint: 'legacy help' });
    expect(groups[2]?.fields[1]).toMatchObject({ translatable: true, default: { ar: 'أهلاً', en: 'Hello' } });
    expect(groups[1]?.fields[0]?.options).toEqual([{ value: 'Cairo', label: 'Cairo' }]);
    expect(JSON.stringify(groups)).not.toContain('"group"');
  });
});

describe('fieldToJson', () => {
  it('serialises list fields with their item fields and max', () => {
    const json = fieldToJson({
      id: 'slides',
      type: 'list',
      label: 'Slides',
      max: 5,
      item: [
        { id: 'heading', type: 'text', label: 'Heading', translatable: true, default: '' },
        { id: 'overlay', type: 'range', label: 'Overlay', min: 0, max: 90, default: 35, responsive: true, css_property: 'padding-block' },
      ],
      default: [{ heading: { ar: 'أ', en: 'A' }, overlay: 20 }],
    });
    expect(json.type).toBe('list');
    expect(json.max).toBe(5);
    expect(json.item?.map((f) => f.id)).toEqual(['heading', 'overlay']);
    expect(json.item?.[1]).toMatchObject({ responsive: true, css_property: 'padding-block', min: 0, max: 90 });
    expect(json.default).toEqual([{ heading: { ar: 'أ', en: 'A' }, overlay: 20 }]);
  });
});

describe('buildBackendManifest', () => {
  const Section = (): null => null;
  const module: ThemeModule = {
    manifest: {
      id: 'demo',
      name: 'Demo',
      version: '1.2.3',
      description: 'd',
      author: 'a',
      archetype: 'General Store',
      tags: [],
      schemaVersion: 2,
      supports: { colorSchemes: ['light'] },
      capabilities: ['rtl', 'wishlist'],
      minEngineVersion: '1.0.0',
      settingsSchema: schema,
    },
    tokens: {} as ThemeModule['tokens'],
    defaultSettings: {},
    createTokens: () => ({}) as ThemeModule['tokens'],
    sections: { hero: Section, faq: Section, legacy: Section },
    sectionSchemas: [
      { type: 'hero', label: 'Hero', category: 'hero', icon: 'HiOutlinePhoto', settings: [{ id: 'heading', type: 'text', label: 'Heading', default: '' }] },
      { type: 'faq', label: 'FAQ', category: 'content', settings: [] },
      { type: 'not-rendered', label: 'Ghost', category: 'content', settings: [] },
    ],
    templates: {
      home: { template: 'home', sections: [{ type: 'hero', id: 'h', settings: { heading: { ar: 'x', en: 'y' } } }, { type: 'faq', id: 'f' }] },
      product: { template: 'product', sections: [{ type: 'hero' }] },
      category: { template: 'category', sections: [] },
      cart: { template: 'cart', sections: [] },
    },
  };

  it('emits the contract shape with derived key/bundle/category and only renderable section types', () => {
    const json = buildBackendManifest(module, {
      id: 'demo', name: 'Demo', version: '1.2.3', archetype: 'General Store', description: 'd', author: 'a', tags: [], accent: '#000',
      minEngineVersion: '1.0.0', capabilities: [], license: { type: 'free' }, featured: true,
      changelog: [{ version: '1.2.3', date: '2026-09-05', notes: ['First.'] }],
      load: () => module,
    });
    expect(json).toMatchObject({
      key: 'demo',
      bundle_url: 'builtin:demo@1.2.3',
      category: 'general',
      is_marketplace: true,
      is_featured: true,
      min_platform_version: '1.0.0',
      preview_image: '/media/theme-previews/demo.jpg',
      supported_features: ['rtl', 'wishlist'],
      changelog: '1.2.3 (2026-09-05): First.',
    });
    expect(Object.keys(json.sections_schema)).toEqual(['hero', 'faq', 'legacy']);
    expect(json.sections_schema['hero']).toMatchObject({ label: 'Hero', category: 'hero', icon: 'HiOutlinePhoto' });
    expect(json.sections_schema['legacy']).toEqual({ label: 'Legacy', category: 'content', settings: [], style: true });
    expect(Object.keys(json.templates)).toEqual(['home', 'product', 'category']);
    expect(json.templates['home']?.sections).toEqual([{ type: 'hero', settings: { heading: { ar: 'x', en: 'y' } } }, { type: 'faq', settings: {} }]);
  });

  it('emits variants, blocks and style per section (contract §7)', () => {
    const json = toSectionsSchema([
      {
        type: 'hero',
        label: 'Hero',
        category: 'hero',
        style: false,
        variants: {
          field: 'layout',
          options: [{ value: 'slider', label: 'Slider', description: 'Full width', icon: 'HiOutlinePhoto' }, { value: 'split', label: 'Split' }],
          legacy: [{ field: 'style', map: { old: 'split' } }],
        },
        blocks: {
          types: [{ type: 'slide', label: 'Slide', icon: 'HiOutlinePhoto', limit: 8, settings: [{ id: 'heading', type: 'text', label: 'Heading', translatable: true, default: { ar: 'أ', en: 'A' } }] }],
          max: 8,
          legacy: 'slides',
        },
        settings: [{ id: 'layout', type: 'select', label: 'Layout', options: [{ value: 'slider', label: 'Slider' }, { value: 'split', label: 'Split' }], default: 'slider' }],
      },
      { type: 'plain', label: 'Plain', category: 'content', settings: [] },
    ]);
    expect(json['hero']).toMatchObject({
      style: false,
      variants: { field: 'layout', options: [{ value: 'slider', label: 'Slider', description: 'Full width', icon: 'HiOutlinePhoto' }, { value: 'split', label: 'Split' }] },
      blocks: { max: 8, legacy: 'slides', types: [{ type: 'slide', label: 'Slide', icon: 'HiOutlinePhoto', limit: 8 }] },
    });
    expect(json['hero']?.blocks?.types[0]?.settings[0]).toMatchObject({ id: 'heading', type: 'text', translatable: true });
    expect(JSON.stringify(json['hero']?.variants)).not.toContain('legacy');
    expect(json['plain']).toEqual({ label: 'Plain', category: 'content', settings: [], style: true });
    expect(json['plain']).not.toHaveProperty('variants');
    expect(json['plain']).not.toHaveProperty('blocks');
  });

  it('toSectionsSchema / toTemplates tolerate empty input', () => {
    expect(toSectionsSchema([])).toEqual({});
    expect(toTemplates(undefined)).toEqual({});
  });
});
