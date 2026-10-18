/**
 * The Theme Marketplace catalog — the ONE declarative registry of installable themes.
 *
 * Every installable theme is one record here. Installing / uninstalling / activating a theme never
 * touches this file or any application code — the platform reads it as data. Each entry's `load` is a
 * code-split dynamic import (the theme is downloaded only on install/preview), identical to the
 * mechanism the frozen engine registry uses. Listing metadata mirrors the theme's manifest; the
 * platform validator flags any drift once the module is loaded.
 *
 * Add the listing here and its shared loader in loaders.ts. No engine or page changes.
 */
import type { CatalogEntry, ThemeCatalog } from './types';
import { THEME_LOADERS } from './loaders';

export const THEME_CATALOG: ThemeCatalog = [
  {
    id: 'nature-pets', name: 'Nature Pets', version: '1.0.0', archetype: 'Pets',
    description: 'Pet collections with Nature-family navigation, peek campaigns, a split story and FAQ, compact product grids and photography.',
    author: 'Sellchaze', tags: ['pets', 'animals', 'modern', 'rtl'], accent: '#A67500',
    previewImage: '/media/theme-previews/nature-pets.png',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter'],
    license: { type: 'free', sku: 'theme-nature-pets' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-18', notes: ['Independent Nature Pets composition and editable sections.'] }],
    load: THEME_LOADERS['nature-pets'],
  },
  {
    id: 'blast-pets', name: 'Blast Pets', version: '1.0.0', archetype: 'Pets',
    description: 'Pet collections, warm orange navigation, full-image campaigns and photo stories.',
    author: 'Sellchaze', tags: ['pets', 'animals', 'modern', 'rtl'], accent: '#FDAE03',
    previewImage: '/media/theme-previews/blast-pets.png',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter', 'countdown'],
    license: { type: 'free', sku: 'theme-blast-pets' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-16', notes: ['Independent pet storefront and editable campaign sections.'] }],
    load: THEME_LOADERS['blast-pets'],
  },
  {
    id: 'elite-furniture', name: 'Elite Furniture', version: '1.0.0', archetype: 'Furniture',
    description: 'Furniture with cinematic photography, category shelves and image comparison.',
    author: 'Sellchaze', tags: ['furniture', 'modern', 'editorial', 'rtl'], accent: '#C8AA62',
    previewImage: '/media/theme-previews/elite-furniture.png',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'cart-drawer', 'newsletter', 'countdown'],
    license: { type: 'free', sku: 'theme-elite-furniture' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-13', notes: ['Furniture layout and editable sections.'] }],
    load: THEME_LOADERS['elite-furniture'],
  },
  {
    id: 'nature-kids', name: 'Nature Kids', version: '1.0.0', archetype: 'Kids & Lifestyle',
    description: 'Playful clothing, toy collections, linked looks and photo stories.',
    previewImage: '/media/theme-previews/nature-kids.png',
    author: 'Sellchaze', tags: ['kids', 'clothing', 'toys', 'modern', 'rtl'], accent: '#1470F2',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'cart-drawer', 'newsletter'],
    license: { type: 'free', sku: 'theme-nature-kids' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-13', notes: ['Independent layout and editable collections.'] }],
    load: THEME_LOADERS['nature-kids'],
  },
  {
    id: 'pure-furniture', name: 'Pure Furniture', version: '1.0.0', archetype: 'Furniture',
    description: 'Warm furniture, video hero, rounded photos and image comparison.',
    author: 'Sellchaze', tags: ['furniture', 'warm', 'modern', 'rtl'], accent: '#834523',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'cart-drawer', 'quick-add', 'newsletter'],
    license: { type: 'free', sku: 'theme-pure-furniture' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-13', notes: ['Initial release.'] }],
    load: THEME_LOADERS['pure-furniture'],
  },
  {
    id: 'sphinx-v3', name: 'Sphinx V3', version: '1.1.0', archetype: 'Furniture & Lifestyle',
    description: 'Green storefront with category shelves, inline search and mobile navigation.',
    author: 'Sellchaze', tags: ['furniture', 'green', 'classic', 'rtl'], accent: '#006C35',
    minEngineVersion: '1.0.0', capabilities: ['rtl', 'dark-mode', 'cart-drawer', 'quick-add', 'newsletter'],
    license: { type: 'free', sku: 'theme-sphinx-v3' }, featured: true,
    changelog: [{ version: '1.0.0', date: '2026-10-12', notes: ['Independent Sphinx layout, editable sections and phone newsletter.'] }],
    load: THEME_LOADERS['sphinx-v3'],
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
    load: THEME_LOADERS.naseem,
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
    load: THEME_LOADERS.bazaar,
  },
  {
    id: 'sahra',
    name: 'Sahra — صحراء',
    version: '1.0.0',
    archetype: 'Luxury Gifts',
    description: 'Luxury storefront with gold accents and editorial photography.',
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
    load: THEME_LOADERS.sahra,
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
    load: THEME_LOADERS.fresh,
  },
  {
    id: 'techno',
    name: 'Techno — تكنو',
    version: '1.0.0',
    archetype: 'Electronics',
    description: 'Electronics, product comparison and timed deals.',
    author: 'Sellchaze',
    tags: ['electronics', 'tech', 'gadgets', 'navy', 'blue', 'spec-led', 'arabic', 'salla-style'],
    accent: '#2563EB',
    accentAlt: '#06B6D4',
    previewImage: '/media/theme-previews/techno.jpg',
    minEngineVersion: '1.0.0',
    capabilities: ['rtl', 'dark-mode', 'mega-menu', 'search-overlay', 'cart-drawer', 'wishlist', 'compare', 'quick-add', 'newsletter', 'countdown'],
    license: { type: 'free', sku: 'theme-techno' },
    changelog: [{ version: '1.0.0', date: '2026-09-05', notes: ['Initial release — electronics / gadgets theme on the shared section library.'] }],
    load: THEME_LOADERS.techno,
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
