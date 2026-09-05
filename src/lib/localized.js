/**
 * Localized-string helpers for the dashboard (workstream E).
 *
 * Convention (mirrors app/Support/Localization/LocalizedValue.php on the backend):
 *   a localized value is either a plain `string` (legacy, single language) or an object keyed by
 *   locale code — `{ ar: '…', en: '…' }`. Resolution order when reading is
 *   requested locale → fallback (store default) → first non-empty value → ''.
 *
 * Pure functions, no React. Keep them tiny and total (never throw on odd input).
 */

// Two-letter language code with an optional region (`ar`, `en`, `en-US`, `pt_BR`). Deliberately not
// 3-letter codes: short field ids such as `cta` must never be mistaken for a language.
const LOCALE_KEY = /^[a-z]{2}(?:[-_][A-Za-z]{2,4})?$/;

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * True when `value` is a locale-keyed object (`{ ar: '…', en: '…' }`): a non-empty plain object
 * whose keys all look like locale codes and whose values are strings or null/undefined.
 */
export function isLocalized(value) {
    if (!isPlainObject(value)) return false;
    const keys = Object.keys(value);
    if (keys.length === 0) return false;
    return keys.every((k) => LOCALE_KEY.test(k) && (value[k] == null || typeof value[k] === 'string'));
}

/**
 * Read a localized value for `locale`. Strings pass through; objects resolve
 * locale → fallback → first non-empty → ''. Nullish input yields ''.
 */
export function pickLocalized(value, locale, fallback) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (!isPlainObject(value)) return String(value);
    if (locale && nonEmpty(value[locale])) return value[locale];
    if (fallback && nonEmpty(value[fallback])) return value[fallback];
    for (const k of Object.keys(value)) {
        if (nonEmpty(value[k])) return value[k];
    }
    return '';
}

/**
 * Normalise any value into the `{ locale: string }` shape over `locales`.
 * A legacy string lands on `defaultLocale` (or the first locale); missing locales become ''.
 * Existing keys outside `locales` are preserved so nothing the merchant typed is lost.
 */
export function toLocalized(value, locales = ['ar', 'en'], defaultLocale) {
    const list = Array.isArray(locales) && locales.length ? locales : ['ar', 'en'];
    const base = defaultLocale && list.includes(defaultLocale) ? defaultLocale : list[0];
    const out = {};
    list.forEach((l) => { out[l] = ''; });
    if (isPlainObject(value)) {
        Object.keys(value).forEach((k) => {
            out[k] = value[k] == null ? '' : String(value[k]);
        });
    } else if (value != null && value !== '') {
        out[base] = String(value);
    }
    return out;
}

/** Immutable set of one locale's text, normalising the container first. */
export function setLocalized(value, locale, text, locales, defaultLocale) {
    const next = toLocalized(value, locales, defaultLocale);
    next[locale] = text == null ? '' : String(text);
    return next;
}

const isFilled = (v) => {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.some((x) => isFilled(x));
    if (isPlainObject(v)) return Object.values(v).some((x) => isFilled(x));
    return true; // numbers / booleans count as set
};

/**
 * Translation progress per locale.
 *
 * Accepts either shape:
 *   1. per-locale copies — `{ ar: { title, body }, en: { title, body } }` (content pages): every
 *      top-level key is one of `locales`; `keys` restricts which fields count (defaults to the union
 *      of keys across all locales).
 *   2. field map — `{ title: { ar, en }, subtitle: 'legacy' }` (theme settings, menus): each value is
 *      a localized string; a legacy string counts as filled for every locale.
 *
 * Returns `{ [locale]: { filled, total, ratio } }` with ratio in [0, 1] (1 when total is 0).
 */
export function completeness(source, locales = ['ar', 'en'], keys) {
    const list = Array.isArray(locales) && locales.length ? locales : ['ar', 'en'];
    const result = {};
    const src = isPlainObject(source) ? source : {};
    const topKeys = Object.keys(src);
    // Per-locale shape: every top-level key is a language and every value is a copy (an object of
    // fields) — a localized string map as a value means we are looking at shape 2 instead.
    const perLocale = topKeys.length > 0 && topKeys.every((k) =>
        (list.includes(k) || LOCALE_KEY.test(k)) && (src[k] == null || (isPlainObject(src[k]) && !isLocalized(src[k]))));

    if (perLocale) {
        const fields = Array.isArray(keys) && keys.length
            ? keys
            : [...new Set(topKeys.flatMap((l) => Object.keys(isPlainObject(src[l]) ? src[l] : {})))];
        list.forEach((l) => {
            const copy = isPlainObject(src[l]) ? src[l] : {};
            const filled = fields.filter((k) => isFilled(copy[k])).length;
            result[l] = { filled, total: fields.length, ratio: fields.length ? filled / fields.length : 1 };
        });
        return result;
    }

    const fields = Array.isArray(keys) && keys.length ? keys : topKeys;
    list.forEach((l) => {
        const filled = fields.filter((k) => {
            const v = src[k];
            if (isLocalized(v)) return nonEmpty(v[l]);
            return isFilled(v);
        }).length;
        result[l] = { filled, total: fields.length, ratio: fields.length ? filled / fields.length : 1 };
    });
    return result;
}
