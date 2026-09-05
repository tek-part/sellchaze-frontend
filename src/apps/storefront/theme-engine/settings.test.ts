import { describe, expect, it } from 'vitest';
import { defaultSettings, flattenLocalizedSettings, resolveSettings } from './settings';
import type { ThemeSettingsSchema } from './types';

const schema: ThemeSettingsSchema = [
  { id: 'title', type: 'text', label: 'Title', translatable: true, default: { ar: 'عنوان', en: 'Title' } },
  { id: 'columns', type: 'range', label: 'Columns', min: 2, max: 6, default: 4 },
  { id: 'layout', type: 'select', label: 'Layout', options: [{ value: 'grid', label: 'Grid' }, { value: 'carousel', label: 'Carousel' }], default: 'grid' },
  { id: 'collection', type: 'collection', label: 'Collection', default: 'newest' },
  { id: 'enabled', type: 'toggle', label: 'Enabled', default: true },
  {
    id: 'slides',
    type: 'list',
    label: 'Slides',
    max: 3,
    item: [
      { id: 'heading', type: 'text', label: 'Heading', translatable: true, default: { ar: 'شريحة', en: 'Slide' } },
      { id: 'overlay', type: 'range', label: 'Overlay', min: 0, max: 90, default: 35 },
      { id: 'align', type: 'select', label: 'Align', options: [{ value: 'start', label: 'Start' }, { value: 'center', label: 'Center' }], default: 'start' },
      { id: 'cta_url', type: 'url', label: 'Link', default: '/shop' },
    ],
    default: [{ heading: { ar: 'أهلاً', en: 'Hello' }, overlay: 20, align: 'center', cta_url: '/shop' }],
  },
];

describe('resolveSettings — list fields', () => {
  it('passes arrays through, validates each item, drops unknown keys and fills item defaults', () => {
    const out = resolveSettings(schema, {
      slides: [
        { heading: 'One', overlay: 500, align: 'nope', cta_url: 'http://[bad', junk: 'x' },
        { heading: { ar: 'اثنان', en: 'Two' } },
        'garbage',
        null,
      ],
    }, 'en');
    expect(out['slides']).toEqual([
      { heading: 'One', overlay: 90, align: 'start', cta_url: '/shop' },
      { heading: 'Two', overlay: 35, align: 'start', cta_url: '/shop' },
    ]);
    expect(Object.isFrozen(out)).toBe(true);
  });

  it('caps the item count at `max`', () => {
    const out = resolveSettings(schema, { slides: [{ heading: 'a' }, { heading: 'b' }, { heading: 'c' }, { heading: 'd' }] });
    expect((out['slides'] as unknown[]).length).toBe(3);
  });

  it('falls back to the (localised) list default when the value is not an array', () => {
    expect(resolveSettings(schema, { slides: 'nope' }, 'ar')['slides']).toEqual([{ heading: 'أهلاً', overlay: 20, align: 'center', cta_url: '/shop' }]);
    expect(resolveSettings(schema, {}, 'en')['slides']).toEqual([{ heading: 'Hello', overlay: 20, align: 'center', cta_url: '/shop' }]);
  });

  it('picks the item locale map for the requested language and the first non-empty otherwise', () => {
    const out = resolveSettings(schema, { slides: [{ heading: { ar: '', en: 'Only English' } }] }, 'ar');
    expect((out['slides'] as Array<Record<string, unknown>>)[0]?.['heading']).toBe('Only English');
  });
});

describe('resolveSettings — translatable + reference fields', () => {
  it('unwraps localized maps for text and localises translatable defaults', () => {
    expect(resolveSettings(schema, { title: { ar: 'مرحبا', en: 'Hi' } }, 'ar')['title']).toBe('مرحبا');
    expect(resolveSettings(schema, {}, 'ar')['title']).toBe('عنوان');
    expect(resolveSettings(schema, {}, 'en')['title']).toBe('Title');
    expect(defaultSettings(schema, 'en')['title']).toBe('Title');
  });

  it('accepts ids for product/category/collection fields (numbers stringified, strings trimmed)', () => {
    expect(resolveSettings(schema, { collection: 12 })['collection']).toBe('12');
    expect(resolveSettings(schema, { collection: '  bestsellers ' })['collection']).toBe('bestsellers');
    expect(resolveSettings(schema, { collection: { nested: true } })['collection']).toBe('newest');
  });

  it('keeps scalar behaviour: clamps ranges, falls back selects, coerces toggles, drops unknown keys', () => {
    const out = resolveSettings(schema, { columns: 99, layout: 'x', enabled: 'false', extra: 1 });
    expect(out['columns']).toBe(6);
    expect(out['layout']).toBe('grid');
    expect(out['enabled']).toBe(false);
    expect('extra' in out).toBe(false);
  });
});

describe('flattenLocalizedSettings', () => {
  it('flattens locale maps at the top level and inside list items without a schema', () => {
    const flat = flattenLocalizedSettings(
      { announcement_text: { ar: 'أهلاً', en: 'Hello' }, primary_color: '#000', items: [{ label: { ar: 'أ', en: 'A' }, n: 1 }, 'skip'], nested: { deep: { x: 1 } } },
      'ar',
    );
    expect(flat).toEqual({ announcement_text: 'أهلاً', primary_color: '#000', items: [{ label: 'أ', n: 1 }] });
  });
});
