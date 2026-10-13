/**
 * The Theme Marketplace catalog — the ONE declarative registry of installable themes.
 *
 * Every installable theme is one record here. Installing / uninstalling / activating a theme never
 * touches this file or any application code — the platform reads it as data. Each entry's `load` is a
 * code-split dynamic import (the theme is downloaded only on install/preview), identical to the
 * mechanism the frozen engine registry uses. Listing metadata mirrors the theme's manifest; the
 * platform validator flags any drift once the module is loaded.
 *
 * Adding a 6th theme = append one entry below. No engine, page, or component change.
 */
import type { CatalogEntry, ThemeCatalog } from './types';

export const THEME_CATALOG: ThemeCatalog = [
  {
    id: 'elite-furniture', name: 'Elite Furniture', version: '1.0.0', archetype: 'Furniture',
    description: 'An independent furniture storefront with cinematic hero, category photo tiles, featured shelves, image comparison and stacked product photography.',
    author: 'Sellchaze', tags: ['furniture', 'modern', 'editorial', 'rtl'], accent: '#C8AA62',
    previewImage: '/media/theme-previews/elite-furniture.png',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'cart-drawer', 'newsletter', 'countdown'],
    license: { type: 'free', sku: 'theme-elite-furniture' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-13', notes: ['Independent furniture layout, photo comparison and editable sections.'] }],
    load: () => import('../../themes/elite-furniture').then(module => module.eliteTheme),
  },
  {
    id: 'sphinx-v3', name: 'Sphinx V3', version: '1.1.0', archetype: 'Furniture & Lifestyle',
    description: 'A green storefront with a category mosaic, featured category shelves, inline search, a cart drawer and mobile bottom navigation.',
    author: 'Sellchaze', tags: ['furniture', 'green', 'classic', 'rtl'], accent: '#006C35',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'dark-mode', 'cart-drawer', 'quick-add', 'newsletter'],
    license: { type: 'free', sku: 'theme-sphinx-v3' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-12', notes: ['Independent Sphinx layout, editable sections and phone newsletter.'] }],
    load: () => import('../../themes/sphinx').then((module) => module.sphinxTheme),
  },
  {
    id: 'naseem',
    name: 'Naseem — نسيم',
    version: '1.0.0',
    archetype: 'General Store',
    description: 'An airy general store with a search header, category circles, product tabs and flash deals.',
    author: 'Sellchaze',
    tags: ['general', 'clean', 'modern', 'arabic', 'light', 'salla-style'],
    accent: '#1D4ED8',
    accentAlt: '#F59E0B',
    previewImage: '/media/theme-previews/naseem.jpg',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'countdown'],
    license: { type: 'free', sku: 'theme-naseem' },
    changelog: [{ version: '1.0.0', date: '2026-09-05', notes: ['Initial release — first theme on the shared section library.'] }],
    featured: true,
    load: () => import('../../themes/naseem').then((m) => m.naseemTheme),
  },
  {
    id: 'bazaar',
    name: 'Bazaar — بازار',
    version: '1.0.0',
    archetype: 'Marketplace',
    description: 'A multi-category marketplace with a category menu, compact product grids and flash deals.',
    author: 'Sellchaze',
    tags: ['marketplace', 'multi-category', 'salla-style', 'arabic', 'dense', 'orange', 'deals'],
    accent: '#C2410C',
    accentAlt: '#1F2937',
    previewImage: '/media/theme-previews/bazaar.jpg',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'mega-menu', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'countdown', 'blog', 'reviews'],
    license: { type: 'free', sku: 'theme-bazaar' },
    changelog: [{ version: '1.0.0', date: '2026-09-05', notes: ['Initial release — marketplace theme on the shared section library.'] }],
    featured: true,
    load: () => import('../../themes/bazaar').then((m) => m.bazaarTheme),
  },
  {
    id: 'sahra',
    name: 'Sahra — صحراء',
    version: '1.0.0',
    archetype: 'Luxury Gifts',
    description: 'A luxury storefront with gold accents, serif headings, cinematic photography and editorial sections.',
    author: 'Sellchaze',
    tags: ['luxury', 'perfume', 'jewellery', 'abaya', 'gifts', 'gold', 'dark', 'editorial', 'arabic', 'salla-style'],
    accent: '#1C1A17',
    accentAlt: '#C9A24D',
    previewImage: '/media/theme-previews/sahra.jpg',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'reviews'],
    license: { type: 'free', sku: 'theme-sahra' },
    changelog: [{ version: '1.0.0', date: '2026-09-05', notes: ['Initial release — luxury theme on the shared section library.'] }],
    featured: true,
    load: () => import('../../themes/sahra').then((m) => m.sahraTheme),
  },
  {
    id: 'fresh',
    name: 'Fresh — فريش',
    version: '1.0.0',
    archetype: 'Grocery & Food',
    description: 'A fresh-market storefront with category circles, quick-add quantities, weekly deals and mobile navigation.',
    author: 'Sellchaze',
    tags: ['grocery', 'food', 'organic', 'market', 'fresh', 'green', 'arabic', 'salla-style'],
    accent: '#15803D',
    accentAlt: '#84CC16',
    previewImage: '/media/theme-previews/fresh.jpg',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'countdown', 'blog'],
    license: { type: 'free', sku: 'theme-fresh' },
    changelog: [{ version: '1.0.0', date: '2026-09-05', notes: ['Initial release — grocery / fresh-market theme on the shared section library.'] }],
    load: () => import('../../themes/fresh').then((m) => m.freshTheme),
  },
  {
    id: 'techno',
    name: 'Techno — تكنو',
    version: '1.0.0',
    archetype: 'Electronics',
    description: 'An electronics storefront with technical product cards, comparison, a category menu and timed deals.',
    author: 'Sellchaze',
    tags: ['electronics', 'tech', 'gadgets', 'navy', 'blue', 'spec-led', 'arabic', 'salla-style'],
    accent: '#2563EB',
    accentAlt: '#06B6D4',
    previewImage: '/media/theme-previews/techno.jpg',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'mega-menu', 'search-overlay', 'cart-drawer', 'wishlist', 'compare', 'quick-add', 'newsletter', 'countdown'],
    license: { type: 'free', sku: 'theme-techno' },
    changelog: [{ version: '1.0.0', date: '2026-09-05', notes: ['Initial release — electronics / gadgets theme on the shared section library.'] }],
    load: () => import('../../themes/techno').then((m) => m.technoTheme),
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
