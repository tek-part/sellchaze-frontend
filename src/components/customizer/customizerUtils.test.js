import { describe, expect, it } from 'vitest';
import {
    STYLE_DEFAULTS, applyStyleValues, editableSectionFields, legacyListFields, matchLegacyList, migrateLegacyBlocks,
    newBlock, newSection, normalizeBlocks, seedBlocks, styleFields, styleValuesFor, variantsOf,
} from './customizerUtils';

const LOCALES = ['ar', 'en'];
const t = (_key, fallback) => fallback;

const slideBlock = {
    type: 'slide',
    label: 'Slide',
    settings: [
        { id: 'image', type: 'image', label: 'Image', default: '' },
        { id: 'heading', type: 'text', label: 'Heading', translatable: true, default: '' },
        { id: 'cta_url', type: 'url', label: 'Link', default: '' },
    ],
};

const heroSchema = {
    type: 'hero-slider',
    label: 'Hero slider',
    category: 'hero',
    settings: [
        { id: 'autoplay', type: 'toggle', label: 'Autoplay', default: true },
        {
            id: 'slides', type: 'list', label: 'Slides', max: 8,
            item: [
                { id: 'image', type: 'image', label: 'Image', default: '' },
                { id: 'heading', type: 'text', label: 'Heading', translatable: true, default: '' },
                { id: 'cta_url', type: 'url', label: 'Link', default: '' },
            ],
            default: [{ heading: { ar: 'أهلاً', en: 'Hello' } }, { heading: { ar: 'ثانية', en: 'Second' } }],
        },
    ],
    variants: { field: 'layout', options: [{ value: 'full', label: 'Full' }, { value: 'split', label: 'Split', description: 'Text beside image' }] },
    blocks: { types: [slideBlock], max: 5 },
};

describe('legacy list → blocks migration', () => {
    it('matches a legacy list to its block type by item field ids', () => {
        const field = heroSchema.settings[1];
        expect(matchLegacyList(field, heroSchema)?.type).toBe('slide');
        expect(legacyListFields(heroSchema).map((m) => m.field.id)).toEqual(['slides']);
        expect(editableSectionFields(heroSchema).map((f) => f.id)).toEqual(['autoplay']);
    });

    it('falls back to field overlap when the list name is unconventional', () => {
        const schema = {
            ...heroSchema,
            settings: [{ id: 'hero_entries', type: 'list', label: 'Entries', item: heroSchema.settings[1].item }],
        };
        expect(matchLegacyList(schema.settings[0], schema)?.type).toBe('slide');
    });

    it('does not match a list whose item fields differ from every block type', () => {
        const schema = {
            ...heroSchema,
            settings: [{ id: 'slides', type: 'list', label: 'Slides', item: [{ id: 'foo', type: 'text' }, { id: 'bar', type: 'text' }] }],
        };
        expect(matchLegacyList(schema.settings[0], schema)).toBeNull();
        expect(editableSectionFields(schema).map((f) => f.id)).toEqual(['slides']);
    });

    it('converts legacy rows into blocks, keeps only known keys and seeds defaults', () => {
        const section = {
            id: 's1', type: 'hero-slider', is_visible: true, reusable_section_id: null,
            settings: { autoplay: false, slides: [{ image: '/a.jpg', heading: { ar: 'أ', en: 'A' }, legacy_only: 1 }, { heading: 'B' }] },
        };
        const out = migrateLegacyBlocks(section, heroSchema, LOCALES, 'ar');
        expect(out).not.toBe(section);
        expect(out.settings.blocks).toHaveLength(2);
        expect(out.settings.blocks[0]).toMatchObject({ type: 'slide', hidden: false, settings: { image: '/a.jpg', heading: { ar: 'أ', en: 'A' }, cta_url: '' } });
        expect(out.settings.blocks[0].settings).not.toHaveProperty('legacy_only');
        expect(out.settings.blocks[0].id).toMatch(/^b_[0-9a-f]{8}$/);
        expect(out.settings.blocks[1].settings.heading).toBe('B');
        // Legacy field and untouched settings survive (contract §7 backward compatibility).
        expect(out.settings.slides).toBe(section.settings.slides);
        expect(out.settings.autoplay).toBe(false);
    });

    it('caps migrated blocks at blocks.max', () => {
        const rows = Array.from({ length: 7 }, (_, i) => ({ heading: `S${i}` }));
        const out = migrateLegacyBlocks({ id: 's', type: 'hero-slider', settings: { slides: rows } }, heroSchema, LOCALES, 'ar');
        expect(out.settings.blocks).toHaveLength(5);
    });

    it('is a no-op (same reference) when blocks already exist, no legacy list is present, or the schema has no blocks', () => {
        const withBlocks = { id: 's', type: 'hero-slider', settings: { blocks: [] , slides: [{ heading: 'x' }] } };
        expect(migrateLegacyBlocks(withBlocks, heroSchema, LOCALES, 'ar')).toBe(withBlocks);
        const noList = { id: 's', type: 'hero-slider', settings: { autoplay: true } };
        expect(migrateLegacyBlocks(noList, heroSchema, LOCALES, 'ar')).toBe(noList);
        const legacySchema = { ...heroSchema, blocks: undefined };
        const legacy = { id: 's', type: 'hero-slider', settings: { slides: [{ heading: 'x' }] } };
        expect(migrateLegacyBlocks(legacy, legacySchema, LOCALES, 'ar')).toBe(legacy);
    });

    it('normalises persisted blocks and drops malformed entries', () => {
        const out = normalizeBlocks([{ type: 'slide', settings: { heading: 'a' } }, { id: 'b_1', type: 'slide', hidden: 1 }, null, { settings: {} }]);
        expect(out).toHaveLength(2);
        expect(out[0].id).toMatch(/^b_/);
        expect(out[0].hidden).toBe(false);
        expect(out[1]).toMatchObject({ id: 'b_1', hidden: false, settings: {} });
    });
});

describe('newSection / seedBlocks', () => {
    it('converts the legacy list defaults into starter blocks', () => {
        const s = newSection('hero-slider', heroSchema, LOCALES, 'ar');
        expect(s.settings.blocks).toHaveLength(2);
        expect(s.settings.blocks[0].settings.heading).toEqual({ ar: 'أهلاً', en: 'Hello' });
        expect(s.settings.autoplay).toBe(true);
    });

    it('seeds three blocks for slider-like sections without list defaults, respecting max', () => {
        const schema = { type: 'brand-logos', label: 'Brand logos', settings: [], blocks: { types: [{ type: 'logo', label: 'Logo', settings: [{ id: 'image', type: 'image' }] }], max: 2 } };
        expect(seedBlocks(schema, LOCALES, 'ar')).toHaveLength(2);
        const uncapped = { ...schema, blocks: { types: schema.blocks.types } };
        expect(seedBlocks(uncapped, LOCALES, 'ar')).toHaveLength(3);
        expect(newSection('brand-logos', uncapped, LOCALES, 'ar').settings.blocks).toHaveLength(3);
    });

    it('uses blocks.min and defaultBlocks hints when present', () => {
        const schema = { type: 'rich-text', label: 'Rich text', settings: [], blocks: { types: [{ type: 'paragraph', label: 'Paragraph', settings: [{ id: 'text', type: 'textarea', default: 'hi' }] }], min: 1 } };
        expect(seedBlocks(schema, LOCALES, 'ar').map((b) => b.type)).toEqual(['paragraph']);
        const hinted = { ...schema, blocks: { ...schema.blocks, defaultBlocks: [{ type: 'paragraph', settings: { text: 'custom' } }, { type: 'nope' }] } };
        const seeded = seedBlocks(hinted, LOCALES, 'ar');
        expect(seeded).toHaveLength(1);
        expect(seeded[0].settings.text).toBe('custom');
    });

    it('does not seed generic sections and leaves sections without blocks untouched', () => {
        const generic = { type: 'newsletter', label: 'Newsletter', settings: [], blocks: { types: [{ type: 'note', label: 'Note', settings: [] }] } };
        expect(newSection('newsletter', generic, LOCALES, 'ar').settings.blocks).toEqual([]);
        expect(newSection('plain', { type: 'plain', settings: [{ id: 'title', type: 'text', default: 'x' }] }, LOCALES, 'ar').settings).toEqual({ title: 'x' });
    });

    it('builds blocks with library defaults', () => {
        const b = newBlock(slideBlock, LOCALES, 'en');
        expect(b).toMatchObject({ type: 'slide', hidden: false, settings: { image: '', heading: { ar: '', en: '' }, cta_url: '' } });
    });
});

describe('variants', () => {
    it('normalises the variant picker definition and rejects malformed ones', () => {
        expect(variantsOf(heroSchema)).toEqual({
            field: 'layout',
            options: [
                { value: 'full', label: 'Full', description: '', icon: '' },
                { value: 'split', label: 'Split', description: 'Text beside image', icon: '' },
            ],
        });
        expect(variantsOf({})).toBeNull();
        expect(variantsOf({ variants: { field: 'layout', options: [] } })).toBeNull();
        expect(variantsOf({ variants: { options: [{ value: 'a' }] } })).toBeNull();
    });
});

describe('section style mapping', () => {
    it('reads __style over defaults and surfaces the section-level __responsive map', () => {
        const settings = { title: 'x', __style: { padding_top: 32, background: 'custom' }, __responsive: { padding_top: { mobile: 16 }, gap: { tablet: 8 } } };
        expect(styleValuesFor(settings)).toEqual({ ...STYLE_DEFAULTS, padding_top: 32, background: 'custom', __responsive: settings.__responsive });
        expect(styleValuesFor({})).toEqual(STYLE_DEFAULTS);
        expect(styleValuesFor(undefined)).toEqual(STYLE_DEFAULTS);
    });

    it('writes form values back to settings.__style and settings.__responsive without touching other keys', () => {
        const settings = { title: 'x', blocks: [{ id: 'b_1', type: 'slide', hidden: false, settings: {} }], __style: { anchor: 'top' }, __responsive: { gap: { tablet: 8 } } };
        const form = { ...styleValuesFor(settings), padding_bottom: 96, container: 'full', __responsive: { ...settings.__responsive, padding_top: { mobile: 24 } } };
        const out = applyStyleValues(settings, form);
        expect(out.title).toBe('x');
        expect(out.blocks).toBe(settings.blocks);
        expect(out.__style).toMatchObject({ anchor: 'top', padding_bottom: 96, container: 'full', padding_top: STYLE_DEFAULTS.padding_top });
        expect(out.__style).not.toHaveProperty('__responsive');
        expect(out.__responsive).toEqual({ gap: { tablet: 8 }, padding_top: { mobile: 24 } });
        // Round trip is stable.
        expect(styleValuesFor(out)).toEqual(form);
    });

    it('keeps __responsive untouched when the form did not carry one', () => {
        const out = applyStyleValues({ __responsive: { gap: { mobile: 4 } } }, { padding_top: 8 });
        expect(out.__responsive).toEqual({ gap: { mobile: 4 } });
        expect(out.__style).toEqual({ padding_top: 8 });
    });

    it('exposes the contract §7 keys as fields, with colour/image only for custom backgrounds', () => {
        const base = styleFields(t, STYLE_DEFAULTS).map((f) => f.id);
        expect(base).toEqual(['padding_top', 'padding_bottom', 'background', 'container', 'text_align', 'hide_mobile', 'hide_desktop', 'anchor', 'css_class']);
        const custom = styleFields(t, { background: 'custom' }).map((f) => f.id);
        expect(custom).toContain('background_color');
        expect(custom).toContain('background_image');
        const padding = styleFields(t, STYLE_DEFAULTS).find((f) => f.id === 'padding_top');
        expect(padding).toMatchObject({ type: 'range', min: 0, max: 200, responsive: true });
    });
});
