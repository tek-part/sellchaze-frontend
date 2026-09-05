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
  {
    id: 'naseem',
    name: 'Naseem — نسيم',
    version: '1.0.0',
    archetype: 'General Store',
    description:
      'Clean, modern general-store theme — light and airy with a blue primary, Arabic-first ' +
      'typography, sticky search header, category circles, product tabs, flash deals and a ' +
      'newsletter band. Built on the shared section library: every block is editable in the customizer.',
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
    description:
      'Salla-style multi-category marketplace — warm amber primary on white with deep-charcoal text, a ' +
      'two-row header with a big category search and an "All categories" mega-menu, compact rounded ' +
      'cards, promo badges, flash deals with countdown, product tabs and dense grids. Built on the shared ' +
      'section library: every block is editable in the customizer.',
    author: 'Sellchaze',
    tags: ['marketplace', 'multi-category', 'salla-style', 'arabic', 'dense', 'orange', 'deals'],
    accent: '#F97316',
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
    description:
      'Luxury theme for perfumes, jewellery, abayas and gifts — warm sand or deep charcoal canvas, ' +
      'gold accents, serif headings (Playfair Display / Amiri), thin gold rules, centred minimal header, ' +
      'cinematic full-bleed hero, editorial image-with-text and hover-swap product cards. Built on the ' +
      'shared section library: every block is editable in the customizer.',
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
    description:
      'Friendly grocery & fresh-market theme — green primary with a lime accent on a cream canvas, ' +
      'pill shapes, a delivery-time promise in the header, big quick-add buttons with quantity ' +
      'steppers on cards, category circles, weekly deals with a countdown and a sticky bottom tab bar ' +
      'on phones. Built on the shared section library: every block is editable in the customizer.',
    author: 'Sellchaze',
    tags: ['grocery', 'food', 'organic', 'market', 'fresh', 'green', 'arabic', 'salla-style'],
    accent: '#16A34A',
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
    description:
      'Electronics & gadgets theme — navy header and footer, electric-blue primary with cyan accents ' +
      'on a light-grey page, sharp technical typography, spec chips and price/discount emphasis on ' +
      'cards, a compare tray, category mega-menu, support hotline, trust bar, flash deals with a ' +
      'countdown and a brand wall. Built on the shared section library: every block is editable in the customizer.',
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
