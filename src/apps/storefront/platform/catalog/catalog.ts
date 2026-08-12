/**
 * The Theme Marketplace catalog — the ONE declarative registry of installable themes.
 *
 * Every installable theme is one record here. Installing / uninstalling / activating a theme never
 * touches this file or any application code — the platform reads it as data. Each entry's `load` is a
 * code-split dynamic import (the theme is downloaded only on install/preview), identical to the
 * mechanism the frozen engine registry uses. Listing metadata mirrors the theme's manifest; the
 * platform validator flags any drift once the module is loaded.
 *
 * Adding a 5th theme = append one entry below. No engine, page, or component change.
 */
import type { CatalogEntry, ThemeCatalog } from './types';

export const THEME_CATALOG: ThemeCatalog = [
  {
    id: 'luxury-fashion',
    name: 'Modern Luxury Fashion',
    version: '1.0.0',
    archetype: 'Luxury Fashion',
    description:
      'Editorial ivory-and-ink fashion — hairline structure, champagne-gold focus, a Canela-style ' +
      'serif over a clean grotesque, restrained motion, and gallery-grade whitespace.',
    author: 'Sellchaze',
    tags: ['luxury', 'fashion', 'editorial', 'minimal', 'premium'],
    accent: '#0B0B0C',
    accentAlt: '#C8A96A',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'reviews', 'countdown', 'lookbook', 'instagram'],
    license: { type: 'free', sku: 'theme-luxury-fashion' },
    changelog: [{ version: '1.0.0', date: '2026-07-15', notes: ['Initial release.'] }],
    featured: true,
    load: () => import('../../themes/luxury-fashion').then((m) => m.luxuryFashionTheme),
  },
  {
    id: 'voltage',
    name: 'Voltage — Tech Commerce',
    version: '1.0.0',
    archetype: 'Tech Commerce',
    description:
      'High-contrast dark-first tech commerce — carbon canvas, voltage-cyan + signal-lime, a ' +
      'geometric grotesque with tabular numerals, neon focus glow, and dense spec-led layouts.',
    author: 'Sellchaze',
    tags: ['tech', 'electronics', 'dark', 'high-contrast', 'spec-led'],
    accent: '#22D3EE',
    accentAlt: '#A3E635',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'compare', 'quick-view', 'reviews', 'newsletter', 'countdown', 'blog'],
    license: { type: 'free', sku: 'theme-voltage' },
    changelog: [{ version: '1.0.0', date: '2026-07-15', notes: ['Initial release.'] }],
    load: () => import('../../themes/voltage').then((m) => m.voltageTheme),
  },
  {
    id: 'hearth',
    name: 'Hearth — Home & Living',
    version: '1.0.0',
    archetype: 'Furniture & Home',
    description:
      'Warm, tactile home retail — soft oat-and-clay canvas, terracotta + sage accents, a humanist ' +
      'serif over a soft sans, large soft radii, and room-context photography.',
    author: 'Sellchaze',
    tags: ['furniture', 'home', 'living', 'warm', 'lifestyle', 'tactile'],
    accent: '#B4623C',
    accentAlt: '#6E7F5B',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'newsletter', 'lookbook'],
    license: { type: 'free', sku: 'theme-hearth' },
    changelog: [{ version: '1.0.0', date: '2026-07-16', notes: ['Initial release.'] }],
    load: () => import('../../themes/hearth').then((m) => m.hearthTheme),
  },
  {
    id: 'rouge',
    name: 'Rouge — Luminous Beauty',
    version: '1.0.0',
    archetype: 'Luxury Beauty',
    description:
      'Editorial luxury beauty & cosmetics — porcelain lit from within, a rouge primary with gilded-' +
      'rose flourishes, a didone display serif over a humanist sans, pillowy radii, soft rose bloom, ' +
      'and shade-first merchandising.',
    author: 'Sellchaze',
    tags: ['beauty', 'cosmetics', 'luxury', 'editorial', 'feminine'],
    accent: '#B23052',
    accentAlt: '#C79A6D',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'reviews', 'newsletter', 'countdown', 'lookbook', 'instagram'],
    license: { type: 'free', sku: 'theme-rouge' },
    changelog: [{ version: '1.0.0', date: '2026-07-16', notes: ['Initial release.'] }],
    featured: true,
    load: () => import('../../themes/rouge').then((m) => m.rougeTheme),
  },
];

/** All catalog entries. */
export function listCatalog(): ThemeCatalog {
  return THEME_CATALOG;
}

/** Look up a listing by id. */
export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return THEME_CATALOG.find((entry) => entry.id === id);
}
