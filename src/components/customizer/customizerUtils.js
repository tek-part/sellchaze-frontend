import { toLocalized } from '../../lib/localized';

/**
 * Shared helpers for the live customizer (docs/THEME_SECTIONS_CONTRACT.md §1).
 * Pure functions only — no React.
 */

/** Section library categories in display order (contract §1 `SectionSchema.category`). */
export const CATEGORY_ORDER = ['hero', 'products', 'categories', 'content', 'marketing', 'social', 'layout'];

/** Viewports in the order the toggle shows them. */
export const VIEWPORTS = ['desktop', 'tablet', 'mobile'];

/** Fallback widths when editor-domain is unavailable (contract §5 / VIEWPORT_WIDTH). */
export const FALLBACK_VIEWPORT_WIDTH = { desktop: 1440, tablet: 768, mobile: 390 };

/** Text-like fields flagged `translatable` hold `{ ar, en }` maps. */
export const isTranslatable = (field) => field?.translatable === true && ['text', 'textarea', 'richtext', 'url'].includes(field.type);

/** `select.options` may be `{value,label}` objects or bare strings (legacy manifests). */
export function normalizeOptions(options) {
    if (!Array.isArray(options)) return [];
    return options
        .map((o) => (o && typeof o === 'object' ? { value: String(o.value ?? ''), label: String(o.label ?? o.value ?? '') } : { value: String(o), label: String(o) }))
        .filter((o) => o.value !== '');
}

/** Library default for one field (contract §1 `default`). */
export function fieldDefault(field, locales, defaultLocale) {
    if (!field) return '';
    if (field.type === 'list') {
        const rows = Array.isArray(field.default) ? field.default : [];
        return rows.map((row) => ({ ...defaultsFor(field.item || [], locales, defaultLocale), ...(row && typeof row === 'object' ? row : {}) }));
    }
    if (isTranslatable(field)) return toLocalized(field.default ?? '', locales, defaultLocale);
    if (field.default !== undefined && field.default !== null) return field.default;
    switch (field.type) {
        case 'toggle': return false;
        case 'number':
        case 'range': return field.min ?? 0;
        case 'select': return normalizeOptions(field.options)[0]?.value ?? '';
        case 'color': return '#000000';
        default: return '';
    }
}

/** Defaults for a whole field list, keyed by field id. */
export function defaultsFor(fields, locales, defaultLocale) {
    const out = {};
    (fields || []).forEach((f) => { out[f.id] = fieldDefault(f, locales, defaultLocale); });
    return out;
}

/**
 * Build a fresh section instance from its schema. Sections whose schema declares `blocks`
 * (contract §7) start with seeded blocks: legacy list defaults are converted first, otherwise
 * `seedBlocks` fills `min` (or three for slider/banner/feature-like sections).
 */
export function newSection(type, schema, locales, defaultLocale) {
    const section = {
        id: crypto.randomUUID(),
        type,
        settings: defaultsFor(schema?.settings || [], locales, defaultLocale),
        reusable_section_id: null,
        is_visible: true,
    };
    if (!hasBlocks(schema)) return section;
    const migrated = migrateLegacyBlocks(section, schema, locales, defaultLocale);
    if (Array.isArray(migrated.settings.blocks) && migrated.settings.blocks.length) return migrated;
    return { ...section, settings: { ...section.settings, blocks: seedBlocks(schema, locales, defaultLocale) } };
}

/** Sections as the API expects them (contract §3): client ids stripped. */
export function toApiSections(sections) {
    return sections.map(({ id: _id, ...section }) => section);
}

/** Sections as the preview expects them (contract §5 hydrate payload). */
export function toPreviewSections(sections) {
    return sections.map((s) => ({ id: s.id, type: s.type, settings: s.settings ?? {}, is_visible: s.is_visible !== false }));
}

/** Normalise a loaded page's sections into editable instances with stable client ids. */
export function fromApiSections(list) {
    return (Array.isArray(list) ? list : []).map((s) => {
        const settings = s.settings && typeof s.settings === 'object' ? s.settings : {};
        return {
            id: String(s.id ?? crypto.randomUUID()),
            type: s.type,
            // `blocks` / `__style` / `__responsive` (contract §7) ride along inside settings untouched;
            // only block ids are normalised so the tree has stable keys.
            settings: Array.isArray(settings.blocks) ? { ...settings, blocks: normalizeBlocks(settings.blocks) } : settings,
            reusable_section_id: s.reusable_section_id ?? null,
            is_visible: s.is_visible ?? true,
        };
    });
}

/** Group a `sections_schema` map by category for the add-section picker. */
export function groupByCategory(schemaMap) {
    const groups = new Map(CATEGORY_ORDER.map((c) => [c, []]));
    Object.entries(schemaMap || {}).forEach(([type, schema]) => {
        const category = CATEGORY_ORDER.includes(schema?.category) ? schema.category : 'content';
        groups.get(category).push({ type, ...schema });
    });
    return [...groups.entries()].filter(([, items]) => items.length > 0).map(([category, items]) => ({ category, items }));
}

/** Ensure a colour is `#rrggbb` for the native picker; anything else falls back. */
export function toHex6(value, fallback = '#000000') {
    if (typeof value !== 'string') return fallback;
    const v = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase();
    return fallback;
}

/** Stable JSON for change detection. */
export const stableJson = (value) => JSON.stringify(value ?? null);

/** Resolve the storefront origin used for the preview iframe (contract §5). */
export function previewBaseFor(store) {
    if (import.meta.env.DEV) return `${window.location.origin}/`;
    const url = store?.storefront_url || store?.public_url || '';
    if (!url) return '';
    return url.endsWith('/') ? url : `${url}/`;
}

/** Contract §5 preview URL for a locale (and optionally a non-active theme key). */
export function previewUrlFor(base, locale, themeKey) {
    if (!base) return '';
    const url = new URL(base);
    url.searchParams.set('preview', '1');
    url.searchParams.set('customize', '1');
    url.searchParams.set('lang', locale);
    if (themeKey) url.searchParams.set('theme', themeKey);
    return url.toString();
}

// ---------------------------------------------------------------------------------------------
// Variants, blocks and section style (contract §7)
// ---------------------------------------------------------------------------------------------

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** Block ids are short and prefixed so they never collide with section ids. */
export const newBlockId = () => `b_${crypto.randomUUID().slice(0, 8)}`;

/** Block types a section schema allows (empty when the manifest predates §7). */
export function blockTypes(schema) {
    const types = schema?.blocks?.types;
    return Array.isArray(types) ? types.filter((b) => b && typeof b.type === 'string' && b.type) : [];
}

export const hasBlocks = (schema) => blockTypes(schema).length > 0;

export const blockSchemaFor = (schema, type) => blockTypes(schema).find((b) => b.type === type) || null;

/** `{ min, max }` for a section's blocks; `max` is `Infinity` when unset. */
export function blockLimits(schema) {
    const min = Number.isFinite(schema?.blocks?.min) ? Math.max(0, schema.blocks.min) : 0;
    const max = Number.isFinite(schema?.blocks?.max) ? Math.max(0, schema.blocks.max) : Infinity;
    return { min, max };
}

/** Variant picker definition, or `null` when the schema has none / it is malformed. */
export function variantsOf(schema) {
    const v = schema?.variants;
    if (!isObject(v) || typeof v.field !== 'string' || !v.field || !Array.isArray(v.options)) return null;
    const options = v.options
        .filter((o) => isObject(o) && o.value !== undefined && o.value !== null)
        .map((o) => ({ value: String(o.value), label: String(o.label ?? o.value), description: o.description ? String(o.description) : '', icon: o.icon ? String(o.icon) : '' }));
    return options.length ? { field: v.field, options } : null;
}

/** Whether the shared "Section style" group is shown (default true, contract §7 `style`). */
export const showsStyle = (schema) => schema?.style !== false;

/** Blocks stored on a section (always an array). */
export const sectionBlocks = (section) => (Array.isArray(section?.settings?.blocks) ? section.settings.blocks : []);

/** Coerce persisted blocks into `{ id, type, hidden, settings }` with stable ids. */
export function normalizeBlocks(list) {
    return (Array.isArray(list) ? list : [])
        .filter((b) => isObject(b) && typeof b.type === 'string' && b.type)
        .map((b) => ({
            ...b,
            id: typeof b.id === 'string' && b.id ? b.id : newBlockId(),
            type: b.type,
            hidden: b.hidden === true,
            settings: isObject(b.settings) ? b.settings : {},
        }));
}

/** A fresh block of `blockSchema.type` with library defaults. */
export function newBlock(blockSchema, locales, defaultLocale) {
    return { id: newBlockId(), type: blockSchema.type, hidden: false, settings: defaultsFor(blockSchema?.settings || [], locales, defaultLocale) };
}

/** Section types that feel empty without a few starter blocks (hero sliders, banner grids, feature rows…). */
const SEEDED_SECTION = /hero|slider|carousel|banner|feature|testimonial|quote|review|faq|question|logo|brand|gallery|tab|marquee|ticker/i;

/**
 * Starter blocks for a brand-new section: a `defaultBlocks` hint (`[{ type, settings? }]` on
 * `schema.blocks` or the schema root) wins, then `blocks.min`, then three of the first type for
 * slider/banner/feature-like sections. Always capped by `max` and the type's own `limit`.
 */
export function seedBlocks(schema, locales, defaultLocale) {
    const types = blockTypes(schema);
    if (!types.length) return [];
    const { min, max } = blockLimits(schema);
    const hint = schema?.blocks?.defaultBlocks ?? schema?.defaultBlocks;
    if (Array.isArray(hint) && hint.length) {
        return hint
            .map((h) => (typeof h === 'string' ? { type: h } : h))
            .filter((h) => isObject(h) && blockSchemaFor(schema, h.type))
            .slice(0, max)
            .map((h) => {
                const block = newBlock(blockSchemaFor(schema, h.type), locales, defaultLocale);
                return isObject(h.settings) ? { ...block, settings: { ...block.settings, ...h.settings } } : block;
            });
    }
    const first = types[0];
    const wanted = min > 0 ? min : (SEEDED_SECTION.test(`${schema?.type || ''} ${schema?.label || ''}`) ? 3 : 0);
    const cap = Math.min(max, Number.isFinite(first.limit) ? first.limit : Infinity);
    const count = Math.max(0, Math.min(wanted, cap));
    return Array.from({ length: count }, () => newBlock(first, locales, defaultLocale));
}

/** Legacy repeater field id → the block type it became (contract §7 backward compatibility). */
export const LEGACY_LIST_TO_BLOCK = {
    slides: 'slide', banners: 'banner', items: 'feature', features: 'feature', quotes: 'quote', testimonials: 'quote',
    questions: 'question', faqs: 'question', logos: 'logo', brands: 'logo', tabs: 'tab', messages: 'message', cards: 'card', steps: 'step',
};

/** Ids of a field list. */
const idsOf = (fields) => new Set((Array.isArray(fields) ? fields : []).map((f) => f?.id).filter(Boolean));

/**
 * Match one legacy `list` field to a block type by comparing item field ids with the block's
 * settings: the conventional name mapping is preferred when it fits, otherwise the type with the
 * best overlap (at least half of the item fields, or a name match when the list has no item fields).
 */
export function matchLegacyList(field, schema) {
    if (!field || field.type !== 'list') return null;
    const types = blockTypes(schema);
    if (!types.length) return null;
    const itemIds = [...idsOf(field.item)];
    const overlap = (b) => itemIds.filter((id) => idsOf(b.settings).has(id)).length;
    const fits = (b) => (itemIds.length === 0 ? true : overlap(b) >= Math.ceil(itemIds.length / 2));
    const named = types.find((b) => b.type === LEGACY_LIST_TO_BLOCK[field.id] || b.type === field.id || `${b.type}s` === field.id);
    if (named && fits(named)) return named;
    if (itemIds.length === 0) return null;
    const best = types.map((b) => [b, overlap(b)]).sort((a, b) => b[1] - a[1])[0];
    return best && fits(best[0]) ? best[0] : null;
}

/** Legacy list fields of a schema that are now represented as blocks: `[{ field, block }]`. */
export function legacyListFields(schema) {
    if (!hasBlocks(schema)) return [];
    return (schema?.settings || [])
        .map((field) => ({ field, block: matchLegacyList(field, schema) }))
        .filter((m) => m.block);
}

/** Section fields shown in the inspector: everything except legacy lists that became blocks and §7 reserved keys. */
export function editableSectionFields(schema) {
    const hidden = new Set(legacyListFields(schema).map((m) => m.field.id));
    return (schema?.settings || []).filter((f) => f && !hidden.has(f.id) && !['blocks', '__style', '__responsive'].includes(f.id));
}

/**
 * One-time migration: a section whose schema has `blocks` but whose settings only carry a legacy
 * list (`slides`, `banners`, `items`…) gets those rows converted into blocks. Returns the SAME
 * object when nothing needs converting so callers can commit it as a no-op-safe history step.
 * The legacy field is left in place (contract §7: runtimes read `blocks` first).
 */
export function migrateLegacyBlocks(section, schema, locales, defaultLocale) {
    if (!section || !hasBlocks(schema)) return section;
    const settings = isObject(section.settings) ? section.settings : {};
    if (Array.isArray(settings.blocks)) return section;
    const matches = legacyListFields(schema).filter((m) => Array.isArray(settings[m.field.id]));
    if (!matches.length) return section;
    const { max } = blockLimits(schema);
    const blocks = [];
    matches.forEach(({ field, block }) => {
        const allowed = idsOf(block.settings);
        const base = defaultsFor(block.settings || [], locales, defaultLocale);
        settings[field.id].forEach((row) => {
            if (blocks.length >= max) return;
            const picked = {};
            Object.entries(isObject(row) ? row : {}).forEach(([k, v]) => { if (allowed.has(k)) picked[k] = v; });
            blocks.push({ id: newBlockId(), type: block.type, hidden: false, settings: { ...base, ...picked } });
        });
    });
    return { ...section, settings: { ...settings, blocks } };
}

/** Human title for a block row: type label + the first text-ish setting. */
export function blockTitle(block, blockSchema, pickText) {
    const label = blockSchema?.label || block?.type || '';
    const textField = (blockSchema?.settings || []).find((f) => ['text', 'textarea'].includes(f.type));
    const raw = textField ? block?.settings?.[textField.id] : null;
    const subtitle = typeof pickText === 'function' ? pickText(raw) : (typeof raw === 'string' ? raw : '');
    return { label, subtitle: typeof subtitle === 'string' ? subtitle.trim() : '' };
}

// ----- section style (`__style` + `__responsive`, contract §7) --------------------------------

export const STYLE_DEFAULTS = Object.freeze({
    padding_top: 64,
    padding_bottom: 64,
    background: 'surface',
    background_color: '',
    background_image: '',
    container: 'boxed',
    text_align: 'start',
    hide_mobile: false,
    hide_desktop: false,
    anchor: '',
    css_class: '',
});

export const STYLE_KEYS = Object.keys(STYLE_DEFAULTS);

/**
 * Field definitions for the "Section style" group. `t(key, fallback)` localises labels; `current`
 * hides the colour / image inputs unless `background === 'custom'`. Padding fields are responsive
 * ranges, so SettingsForm writes per-viewport overrides to `values.__responsive`.
 */
export function styleFields(t, current) {
    const tr = typeof t === 'function' ? t : (_k, d) => d;
    const custom = (current?.background ?? STYLE_DEFAULTS.background) === 'custom';
    const fields = [
        { id: 'padding_top', type: 'range', label: tr('editor_style_padding_top', 'Padding top'), min: 0, max: 200, step: 4, default: STYLE_DEFAULTS.padding_top, responsive: true, css_property: 'padding-block' },
        { id: 'padding_bottom', type: 'range', label: tr('editor_style_padding_bottom', 'Padding bottom'), min: 0, max: 200, step: 4, default: STYLE_DEFAULTS.padding_bottom, responsive: true, css_property: 'padding-block' },
        {
            id: 'background', type: 'segmented', label: tr('editor_style_background', 'Background'), default: 'surface',
            options: [
                { value: 'surface', label: tr('editor_style_bg_surface', 'Theme') },
                { value: 'primary', label: tr('editor_style_bg_primary', 'Primary') },
                { value: 'custom', label: tr('editor_style_bg_custom', 'Custom') },
            ],
        },
    ];
    if (custom) {
        fields.push(
            { id: 'background_color', type: 'color', label: tr('editor_style_background_color', 'Background colour'), default: '' },
            { id: 'background_image', type: 'image', label: tr('editor_style_background_image', 'Background image'), default: '' },
        );
    }
    fields.push(
        {
            id: 'container', type: 'segmented', label: tr('editor_style_container', 'Container width'), default: 'boxed',
            options: [
                { value: 'boxed', label: tr('editor_style_container_boxed', 'Boxed') },
                { value: 'narrow', label: tr('editor_style_container_narrow', 'Narrow') },
                { value: 'full', label: tr('editor_style_container_full', 'Full') },
            ],
        },
        {
            id: 'text_align', type: 'segmented', label: tr('editor_style_text_align', 'Text alignment'), default: 'start',
            options: [
                { value: 'start', label: tr('editor_style_align_start', 'Start') },
                { value: 'center', label: tr('editor_style_align_center', 'Center') },
                { value: 'end', label: tr('editor_style_align_end', 'End') },
            ],
        },
        { id: 'hide_mobile', type: 'toggle', label: tr('editor_style_hide_mobile', 'Hide on mobile'), default: false },
        { id: 'hide_desktop', type: 'toggle', label: tr('editor_style_hide_desktop', 'Hide on desktop'), default: false },
        { id: 'anchor', type: 'text', label: tr('editor_style_anchor', 'Anchor ID'), hint: tr('editor_style_anchor_hint', 'Lets links jump to this section with #id.'), default: '' },
        { id: 'css_class', type: 'text', label: tr('editor_style_css_class', 'CSS class'), default: '' },
    );
    return fields;
}

/**
 * Form values for the style group: `__style` over the defaults, plus the section-level
 * `__responsive` map so the responsive padding controls read/write the contract location.
 */
export function styleValuesFor(settings) {
    const style = isObject(settings?.__style) ? settings.__style : {};
    const out = { ...STYLE_DEFAULTS, ...style };
    if (isObject(settings?.__responsive)) out.__responsive = settings.__responsive;
    return out;
}

/** Inverse of `styleValuesFor`: split the form values back into `settings.__style` and `settings.__responsive`. */
export function applyStyleValues(settings, values) {
    const base = isObject(settings) ? settings : {};
    const { __responsive, ...style } = isObject(values) ? values : {};
    const next = { ...base, __style: { ...(isObject(base.__style) ? base.__style : {}), ...style } };
    if (isObject(__responsive)) next.__responsive = __responsive;
    return next;
}
