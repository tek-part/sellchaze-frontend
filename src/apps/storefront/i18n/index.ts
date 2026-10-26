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
import { createInstance, type BackendModule, type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { setApiLocale } from '../api/client';
import type { Direction } from '../theme-engine/types';

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

/**
 * One module per language, imported on demand: a visitor downloads only the copy they read. The
 * entry awaits `storefrontI18nReady()` (in parallel with the bootstrap request) before the first
 * render, and `changeLanguage()` resolves only once the other language has arrived, so raw keys are
 * never painted.
 */
const bundles: Record<Locale, () => Promise<object>> = {
  en: () => import('./en').then((module) => module.en),
  ar: () => import('./ar').then((module) => module.ar),
};

const lazyBundles: BackendModule = {
  type: 'backend',
  init() {},
  read(language, _namespace, callback) {
    if (!isLocale(language)) {
      callback(null, {});
      return;
    }
    bundles[language]().then(
      (resources) => callback(null, resources as Record<string, unknown>),
      // `true` asks i18next to retry a failed fetch rather than settle on raw keys.
      (error: Error) => callback(error, true),
    );
  },
};

let instance: I18n | undefined;
let ready: Promise<I18n> | undefined;

/** The storefront's i18n instance, created once. Its copy is usable after `storefrontI18nReady()`. */
export function storefrontI18n(): I18n {
  if (instance) return instance;
  const i18n = createInstance();
  const initial = detectLocale();
  // Seed the API client before the first render so even the bootstrap-time requests carry `lang`.
  setApiLocale(initial);
  ready = i18n
    .use(lazyBundles)
    .use(initReactI18next)
    .init({
      lng: initial,
      // en and ar carry identical key sets (pinned by i18n.test.ts), so a language never needs the
      // other downloaded as its fallback.
      fallbackLng: { ar: [], default: [DEFAULT_LOCALE] },
      // Keys are hand-written and namespaced with `.`, and copy contains no interpolation-unsafe
      // markup, so React's own escaping is sufficient.
      interpolation: { escapeValue: false },
      returnNull: false,
    })
    .then(() => i18n);
  instance = i18n;
  return i18n;
}

/** Resolves once the active language's copy is loaded. */
export function storefrontI18nReady(): Promise<I18n> {
  storefrontI18n();
  return ready!;
}
