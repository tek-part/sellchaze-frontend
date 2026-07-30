// Shared helpers for the Community feed components.

/** The five post types (value → i18n key). Labels resolve via t(`feed_type_${value}`). */
export const POST_TYPES = ['new_product', 'ad_offer', 'rfq', 'update_news', 'question'];

/** Initials from a name/company (up to two letters), matching the dashboard avatar look. */
export function initials(name) {
    const s = String(name ?? '').trim();
    if (!s) return '؟';
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Locale-aware relative time (e.g. "5 minutes ago" / "قبل ٥ دقائق").
 * Uses Intl.RelativeTimeFormat so no per-unit translation strings are needed.
 * Falls back to a localized date for anything older than a few weeks.
 */
export function relativeTime(iso, lang = 'en') {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffMs = then - Date.now();
    const abs = Math.abs(diffMs);
    const locale = lang === 'ar' ? 'ar' : 'en';
    let rtf;
    try {
        rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    } catch {
        rtf = null;
    }
    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;
    const week = 7 * day;
    if (rtf) {
        if (abs < min) return rtf.format(Math.round(diffMs / 1000), 'second');
        if (abs < hour) return rtf.format(Math.round(diffMs / min), 'minute');
        if (abs < day) return rtf.format(Math.round(diffMs / hour), 'hour');
        if (abs < week) return rtf.format(Math.round(diffMs / day), 'day');
    }
    try {
        return new Date(then).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return new Date(then).toLocaleDateString();
    }
}
