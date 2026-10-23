import i18n from '../i18n';

// The public marketing site (home, features, pricing, directory, blog, legal) lives on its own
// domain since the dashboard moved to app.sellchaze.com. Override with VITE_MARKETING_URL.
export const MARKETING_URL = (import.meta.env.VITE_MARKETING_URL || 'https://sellchaze.com').replace(/\/$/, '');

const currentLang = () => (i18n.language?.startsWith('ar') ? 'ar' : 'en');

/** Absolute marketing-site URL for a path, in the given (default: current) language; Arabic lives under /ar. */
export function marketingUrl(path = '/', lang = currentLang()) {
    const clean = path === '/' ? '' : path;
    return `${MARKETING_URL}${lang === 'ar' ? '/ar' : ''}${clean}` || '/';
}

/** A company's public profile page on the marketing site. */
export function publicProfileUrl(username) {
    return marketingUrl(`/u/${encodeURIComponent(username)}`);
}
