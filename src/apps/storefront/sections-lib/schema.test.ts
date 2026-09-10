import { describe, expect, it } from 'vitest';
import { resolveSettings } from '../theme-engine/settings';
import { blocksOf, defaultBlock, defineBlock, defineSection, fields, resolveBlocks, sectionStyleFields, tr, variantOf, variants, variantSelect } from './schema';

const slide = defineBlock({
  type: 'slide',
  label: 'Slide',
  limit: 3,
  settings: [fields.text('heading', 'Heading', tr('عنوان', 'Heading')), fields.range('overlay', 'Overlay', 35, 0, 90, 5)],
});
const note = defineBlock({ type: 'note', label: 'Note', settings: [fields.text('text', 'Text', '')] });

const LAYOUTS = variants('layout', [
  { value: 'slider', label: 'Slider' },
  { value: 'split', label: 'Split' },
], { style: { old: 'split' }, layout: { columns: 'split' } });

const schema = defineSection({
  type: 'demo-hero',
  label: 'Demo',
  category: 'hero',
  variants: LAYOUTS,
  blocks: { types: [slide, note], max: 4, legacy: 'slides' },
  settings: [
    variantSelect(LAYOUTS, 'slider'),
    fields.list('slides', 'Slides', [fields.text('heading', 'Heading', ''), fields.range('overlay', 'Overlay', 35, 0, 90, 5)], [
      { heading: tr('أولى', 'First'), overlay: 20 },
      { heading: tr('ثانية', 'Second'), overlay: 50 },
    ], 6),
  ],
});

describe('variantOf', () => {
  it('returns the stored variant, falls back to the select default, and maps legacy keys/values', () => {
    expect(variantOf(schema, { layout: 'split' })).toBe('split');
    expect(variantOf(schema, {})).toBe('slider');
    expect(variantOf(schema, undefined)).toBe('slider');
    expect(variantOf(schema, { layout: 'bogus' })).toBe('slider');
    expect(variantOf(schema, { style: 'old' })).toBe('split');
    expect(variantOf(schema, { layout: 'columns' })).toBe('split');
    expect(variantOf(defineSection({ type: 'plain', label: 'Plain', category: 'content', settings: [] }), { layout: 'x' })).toBe('');
  });

  it('variantSelect mirrors the options so the stored value validates through the engine', () => {
    const field = variantSelect(LAYOUTS, 'slider');
    expect(field).toMatchObject({ id: 'layout', type: 'select', default: 'slider' });
    expect(resolveSettings([field], { layout: 'split' })['layout']).toBe('split');
    expect(resolveSettings([field], { layout: 'nope' })['layout']).toBe('slider');
  });
});

describe('resolveBlocks', () => {
  it('reads settings.blocks first: unknown types dropped, hidden removed, settings resolved per locale, limits applied', () => {
    const blocks = resolveBlocks(schema, {
      blocks: [
        { id: 'a', type: 'slide', settings: { heading: { ar: 'مرحبا', en: 'Hello' }, overlay: 500 } },
        { id: 'h', type: 'slide', hidden: true, settings: {} },
        { id: 'x', type: 'unknown', settings: {} },
        { id: 'b', type: 'slide', settings: {} },
        { id: 'c', type: 'slide', settings: {} },
        { id: 'd', type: 'slide', settings: {} },
        { type: 'note', settings: { text: 'n' } },
        'garbage',
      ],
    }, undefined, { locale: 'ar' });
    expect(blocks.map((b) => b.id)).toEqual(['a', 'b', 'c', 'note-7']);
    expect(blocks[0]?.settings).toEqual({ heading: 'مرحبا', overlay: 90 });
    expect(blocks[1]?.settings).toEqual({ heading: 'عنوان', overlay: 35 });
    expect(blocks[3]?.type).toBe('note');
    expect(resolveBlocks(schema, { blocks: [{ id: 'h', type: 'slide', hidden: true }] }, undefined, { includeHidden: true })[0]?.hidden).toBe(true);
  });

  it('synthesises blocks from the legacy list (stored data, then the list default) when blocks are absent or empty', () => {
    const stored = resolveBlocks(schema, { slides: [{ heading: 'Old one', overlay: 10 }] });
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: 'slides-1', type: 'slide', hidden: false, settings: { heading: 'Old one', overlay: 10 } });

    const fromDefault = resolveBlocks(schema, {}, undefined, { locale: 'en' });
    expect(fromDefault.map((b) => b.settings['heading'])).toEqual(['First', 'Second']);
    expect(resolveBlocks(schema, { blocks: [] }, 'slides', { locale: 'ar' })[0]?.settings['heading']).toBe('أولى');

    // Resolved settings (list already coerced, `blocks` passed through) work the same way.
    const resolved = resolveSettings(schema.settings, { slides: [{ heading: 'R' }] }, 'en');
    expect(resolveBlocks(schema, resolved)[0]?.settings['heading']).toBe('R');
  });

  it('uses the demo fallback only when there is neither blocks nor legacy data', () => {
    const plain = defineSection({ type: 'demo-cols', label: 'Cols', category: 'content', blocks: { types: [note] }, settings: [] });
    const fallback = [{ id: 'demo', type: 'note', settings: { text: 'demo' } }];
    expect(resolveBlocks(plain, {}, undefined, { fallback })[0]?.settings['text']).toBe('demo');
    expect(resolveBlocks(plain, { blocks: [{ id: 'm', type: 'note', settings: { text: 'mine' } }] }, undefined, { fallback })[0]?.settings['text']).toBe('mine');
    expect(resolveBlocks(defineSection({ type: 'no-blocks', label: 'x', category: 'content', settings: [] }), { blocks: [{ type: 'note' }] })).toEqual([]);
  });

  it('blocksOf / defaultBlock', () => {
    expect(blocksOf(schema).map((b) => b.type)).toEqual(['slide', 'note']);
    const fresh = defaultBlock(schema, 'slide', 'en');
    expect(fresh).toMatchObject({ type: 'slide', hidden: false, settings: { heading: 'Heading', overlay: 35 } });
    expect(fresh?.id).toMatch(/^b_[a-z0-9]{8}$/);
    expect(defaultBlock(schema, 'nope')).toBeUndefined();
  });
});

describe('engine pass-through (contract §7)', () => {
  it('resolveSettings keeps blocks, __style and __responsive untouched and drops other unknown keys', () => {
    const blocks = [{ id: 'a', type: 'slide', settings: { heading: 'x' } }];
    const out = resolveSettings(schema.settings, { blocks, __style: { padding_top: 10 }, __responsive: { padding_top: { mobile: 4 } }, junk: 1, __style_bad: 'x' });
    expect(out['blocks']).toBe(blocks);
    expect(out['__style']).toEqual({ padding_top: 10 });
    expect(out['__responsive']).toEqual({ padding_top: { mobile: 4 } });
    expect(out).not.toHaveProperty('junk');
    expect(resolveSettings(schema.settings, { blocks: 'nope', __style: [] })).not.toHaveProperty('blocks');
  });

  it('sectionStyleFields exposes the shared group with stable ids', () => {
    const ids = sectionStyleFields().map((f) => f.id);
    expect(ids).toEqual(['padding_top', 'padding_bottom', 'background', 'background_color', 'background_image', 'container', 'text_align', 'hide_mobile', 'hide_desktop', 'anchor', 'css_class']);
    for (const f of sectionStyleFields()) expect(f.group).toBe('Section style');
  });
});
