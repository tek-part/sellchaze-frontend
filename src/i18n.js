import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Dashboard i18n.
 *
 * The translations live in one module per language (`./i18n/en.js`, `./i18n/ar.js`) so the entry
 * chunk carries neither: a small i18next backend imports the active language on demand. `main.jsx`
 * awaits `i18nReady` before the first render (no flash of raw keys), and `i18n.changeLanguage()`
 * resolves only after the other language has been fetched, so a switch never shows keys either.
 */
export const LOCALE_STORAGE_KEY = 'sellchase_locale';

const bundles = {
    en: () => import('./i18n/en.js'),
    ar: () => import('./i18n/ar.js'),
};

const lazyBundles = {
    type: 'backend',
    init() {},
    read(language, _namespace, callback) {
        const load = bundles[language];
        if (!load) {
            callback(null, {});
            return;
        }
        load().then(
            (module) => callback(null, module.default),
            // `true` asks i18next to retry: a flaky network should not leave the UI on raw keys.
            (error) => callback(error, true),
        );
    },
};

export function storedLanguage() {
    try {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
        return saved === 'ar' || saved === 'en' ? saved : 'en';
    } catch {
        return 'en';
    }
}

/** Resolves once the active language's translations are loaded and `t()` returns real copy. */
export const i18nReady = i18n
    .use(lazyBundles)
    .use(initReactI18next)
    .init({
        lng: storedLanguage(),
        // Arabic carries every English key (pinned by src/lib/i18nResources.test.js), so an Arabic
        // session never needs to download the English bundle as a fallback.
        fallbackLng: { ar: [], default: ['en'] },
        interpolation: { escapeValue: false },
    })
    .then(() => i18n);

export default i18n;
