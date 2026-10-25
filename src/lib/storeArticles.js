// Shared helpers for the merchant blog (store articles) list and editor.

export const ARTICLE_FIELDS = ['title', 'excerpt', 'body', 'image', 'seo_title', 'seo_description', 'date'];
export const ARTICLE_STATUS_TONES = { published: 'is-success', scheduled: 'is-info', archived: 'is-warning', draft: '' };
export const SLUG_MAX = 180;

const firstFilled = (draft, locales, key) => {
    for (const locale of [...locales, ...Object.keys(draft ?? {})]) {
        const value = draft?.[locale]?.[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
};

/** Title in the first preferred locale that has one (falls back to any filled locale). */
export const articleTitle = (article, locales = []) => firstFilled(article?.draft, locales.filter(Boolean), 'title');
export const articleImage = (article, locales = []) => firstFilled(article?.draft, locales.filter(Boolean), 'image');

/**
 * URL slug the backend accepts: Unicode letters/numbers joined by single `-` or `_`
 * (`^[\pL\pN]+(?:[-_][\pL\pN]+)*$`), lowercase, at most 180 characters.
 */
export function slugify(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/\p{M}+/gu, '')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, SLUG_MAX)
        .replace(/-+$/g, '');
}

export const validSlug = (slug) => /^[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u.test(slug) && slug.length <= SLUG_MAX;

const blankTranslation = () => Object.fromEntries(ARTICLE_FIELDS.map((key) => [key, '']));

/** Editor form state from an API article (or a blank post), one translation per supported locale. */
export function articleForm(article, locales) {
    const draft = {};
    for (const locale of [...locales, ...Object.keys(article?.draft ?? {})]) {
        const source = article?.draft?.[locale] ?? {};
        draft[locale] = Object.fromEntries(ARTICLE_FIELDS.map((key) => [key, typeof source[key] === 'string' ? source[key] : '']));
    }
    for (const locale of locales) draft[locale] ??= blankTranslation();
    return { slug: article?.slug ?? '', draft };
}

/** Request body for create/update: every field present, empty values sent as null. */
export function articlePayload(form, version) {
    const draft = Object.fromEntries(Object.entries(form.draft).map(([locale, row]) => [
        locale,
        Object.fromEntries(ARTICLE_FIELDS.map((key) => [key, typeof row[key] === 'string' && row[key].trim() !== '' ? row[key] : null])),
    ]));
    return { slug: form.slug.trim(), draft, ...(version ? { version } : {}) };
}

/** Maps Laravel validation keys (`slug`, `draft.en.title`) to editor fields; other keys stay general. */
export function fieldErrors(errors = {}) {
    const fields = {};
    const general = [];
    for (const [key, messages] of Object.entries(errors ?? {})) {
        const text = [messages].flat().join(' ');
        if (key === 'slug' || /^draft\.[^.]+\.[^.]+$/.test(key)) fields[key] = text;
        else general.push(text);
    }
    return { fields, general: general.join(' ') };
}
