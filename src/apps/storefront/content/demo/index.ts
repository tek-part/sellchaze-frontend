/**
 * Demo catalogue selection.
 *
 * Resolves the catalogue for the active theme so each preview shows its own vertical. The four
 * catalogues (fashion, beauty, home, electronics) are shipped data; each of the five library-based
 * themes is keyed to the closest one: Sahra (luxury gifts) previews the fashion catalogue, Techno
 * electronics, and Naseem / Bazaar / Fresh the home catalogue until they get their own.
 *
 * DEV-only by construction — every caller is behind `import.meta.env.DEV`, which Vite replaces with
 * `false` in production, so Rollup eliminates this module and the catalogues it imports.
 */
import { LUXURY_CATALOG } from './luxury';
import { ROUGE_CATALOG } from './rouge';
import { HEARTH_CATALOG } from './hearth';
import { VOLTAGE_CATALOG } from './voltage';
import type { DemoCatalog } from './types';
import { applyOverlay, type CatalogOverlay } from './localize';
import { LUXURY_AR } from './luxury.ar';
import { HEARTH_AR } from './hearth.ar';
import { VOLTAGE_AR } from './voltage.ar';

export type { DemoCatalog, DemoBrand, DemoFaq, DemoTestimonial } from './types';

/** Theme whose catalogue is used when the id is missing or unknown (the storefront default). */
const DEFAULT_THEME = 'naseem';

const BY_THEME: Readonly<Record<string, DemoCatalog>> = {
  naseem: HEARTH_CATALOG,
  bazaar: HEARTH_CATALOG,
  fresh: HEARTH_CATALOG,
  sahra: LUXURY_CATALOG,
  techno: VOLTAGE_CATALOG,
};

/**
 * Arabic text overlays, keyed the same way as the catalogues. Only text lives here — prices,
 * images, ratings and ids stay canonical, so a fact corrected once is correct in both languages.
 */
const AR_OVERLAY: Readonly<Record<string, CatalogOverlay>> = {
  naseem: HEARTH_AR,
  bazaar: HEARTH_AR,
  fresh: HEARTH_AR,
  sahra: LUXURY_AR,
  techno: VOLTAGE_AR,
};

/**
 * Catalogue for a theme, in a language.
 *
 * Results are memoised per theme+locale: the overlay rebuilds 16 product objects, and re-running
 * that on every render would churn the arrays that feed memoised selectors downstream (facets,
 * sorting, filtering) and defeat them.
 */
const CACHE = new Map<string, DemoCatalog>();

export function catalogFor(themeId: string | undefined, locale = 'en'): DemoCatalog {
  const id = themeId && BY_THEME[themeId] ? themeId : DEFAULT_THEME;
  const base = BY_THEME[id] ?? HEARTH_CATALOG;
  if (locale !== 'ar') return base;

  const key = `${id}:${locale}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const localized = applyOverlay(base, AR_OVERLAY[id]);
  CACHE.set(key, localized);
  return localized;
}

export { LUXURY_CATALOG, ROUGE_CATALOG, HEARTH_CATALOG, VOLTAGE_CATALOG };
