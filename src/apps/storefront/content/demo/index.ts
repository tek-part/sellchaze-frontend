/**
 * Demo catalogue selection.
 *
 * Resolves the catalogue for the active theme so each preview shows its own vertical: Voltage
 * previews electronics, Rouge beauty, Hearth home, Luxury fashion. Previously all four shared one
 * fashion catalogue of eight products, so three themes demonstrated the wrong goods.
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
import { ROUGE_AR } from './rouge.ar';
import { HEARTH_AR } from './hearth.ar';
import { VOLTAGE_AR } from './voltage.ar';

export type { DemoCatalog, DemoBrand, DemoFaq, DemoTestimonial } from './types';

const BY_THEME: Readonly<Record<string, DemoCatalog>> = {
  'luxury-fashion': LUXURY_CATALOG,
  rouge: ROUGE_CATALOG,
  hearth: HEARTH_CATALOG,
  voltage: VOLTAGE_CATALOG,
};

/**
 * Arabic text overlays, keyed the same way as the catalogues. Only text lives here — prices,
 * images, ratings and ids stay canonical, so a fact corrected once is correct in both languages.
 */
const AR_OVERLAY: Readonly<Record<string, CatalogOverlay>> = {
  'luxury-fashion': LUXURY_AR,
  rouge: ROUGE_AR,
  hearth: HEARTH_AR,
  voltage: VOLTAGE_AR,
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
  const base = (themeId && BY_THEME[themeId]) || LUXURY_CATALOG;
  if (locale !== 'ar') return base;

  const key = `${themeId ?? 'luxury-fashion'}:${locale}`;
  const cached = CACHE.get(key);
  if (cached) return cached;

  const localized = applyOverlay(base, AR_OVERLAY[themeId ?? 'luxury-fashion']);
  CACHE.set(key, localized);
  return localized;
}

export { LUXURY_CATALOG, ROUGE_CATALOG, HEARTH_CATALOG, VOLTAGE_CATALOG };
