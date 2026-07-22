/**
 * Storefront internationalisation.
 *
 * Reuses the project's existing i18next dependency — the dashboard already runs its own instance
 * from `src/i18n.js`. This creates a SEPARATE instance rather than sharing that one, because the
 * two apps have disjoint vocabularies and independent language choices: a merchant may run the
 * admin in English while previewing an Arabic storefront, and sharing one instance would couple
 * those. `createInstance()` is the supported way to do that; no second translation system is
 * introduced.
 *
 * Language drives direction. Arabic is RTL, and the theme engine already owns direction state
 * (`setDirection` on the theme context, which writes `dir` on the root), so the locale layer sets
 * language and lets the engine apply direction — one source of truth for each concern.
 */
import { createInstance, type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Direction } from '../theme-engine/types';
import { en } from './en';
import { ar } from './ar';

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Persisted so a returning visitor keeps their language without re-choosing it. */
export const LOCALE_STORAGE_KEY = 'sf:locale';

export const LOCALE_META: Readonly<Record<Locale, { label: string; nativeLabel: string; dir: Direction; htmlLang: string }>> = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr', htmlLang: 'en' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', htmlLang: 'ar' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as ReadonlyArray<string>).includes(value);
}

export function directionFor(locale: Locale): Direction {
  return LOCALE_META[locale].dir;
}

/**
 * Resolve the starting language, most explicit signal first:
 *   1. `?lang=ar` — lets a preview or a shared link pin the language
 *   2. a previously chosen language in storage
 *   3. the browser's own preference, when we support it
 *   4. English
 */
export function detectLocale(search?: string): Locale {
  const hasWindow = typeof window !== 'undefined';

  // An explicitly-passed query string is honoured even with no window — it is the caller telling us
  // the answer, and on a server render it is the ONLY signal available. Bailing out early here
  // meant SSR always produced English regardless of the requested language.
  const query = search ?? (hasWindow ? window.location.search : '');
  const fromUrl = new URLSearchParams(query).get('lang');
  if (isLocale(fromUrl)) return fromUrl;

  if (!hasWindow) return DEFAULT_LOCALE;

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // Private browsing or blocked storage must not prevent the store from rendering.
  }

  const nav = window.navigator.language?.slice(0, 2).toLowerCase();
  if (isLocale(nav)) return nav;

  return DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Non-fatal: the language still applies for this session.
  }
}

let instance: I18n | undefined;

/** The storefront's i18n instance, created once. */
export function storefrontI18n(): I18n {
  if (instance) return instance;
  const i18n = createInstance();
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: detectLocale(),
    fallbackLng: DEFAULT_LOCALE,
    // Keys are hand-written and namespaced with `.`, and copy contains no interpolation-unsafe
    // markup, so React's own escaping is sufficient.
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  instance = i18n;
  return i18n;
}

export { en, ar };
