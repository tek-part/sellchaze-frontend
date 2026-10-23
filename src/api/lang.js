/**
 * The `lang` query param sent to the localized public / feed / pricing endpoints.
 *
 * Mirrors the Accept-Language logic in api/client.js: Arabic only when the active
 * i18n language is 'ar', English otherwise. Centralising the ternary keeps every
 * caller in lock-step and avoids the `i18n.language === 'ar' ? 'ar' : 'en'` copy
 * that was repeated across the community, feed and pricing pages.
 *
 * Usage:
 *   const { lang } = langParam(i18n);          // scalar for deps / display
 *   api.get('/community/sectors', { params: langParam(i18n) });
 */
export function langParam(i18n) {
    return { lang: i18n.language === 'ar' ? 'ar' : 'en' };
}
