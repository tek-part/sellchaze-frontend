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

/** Build a fresh section instance from its schema. */
export function newSection(type, schema, locales, defaultLocale) {
    return {
        id: crypto.randomUUID(),
        type,
        settings: defaultsFor(schema?.settings || [], locales, defaultLocale),
        reusable_section_id: null,
        is_visible: true,
    };
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
    return (Array.isArray(list) ? list : []).map((s) => ({
        id: String(s.id ?? crypto.randomUUID()),
        type: s.type,
        settings: s.settings && typeof s.settings === 'object' ? s.settings : {},
        reusable_section_id: s.reusable_section_id ?? null,
        is_visible: s.is_visible ?? true,
    }));
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
