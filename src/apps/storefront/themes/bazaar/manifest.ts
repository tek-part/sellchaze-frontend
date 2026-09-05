/**
 * Bazaar (بازار) — Salla-style multi-category marketplace theme · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { bazaarSettingsSchema } from './settings';

export const bazaarManifest: ThemeManifest = {
  id: 'bazaar',
  name: 'Bazaar — بازار',
  version: '1.0.0',
  description:
    'A dense, warm multi-category marketplace theme: amber-orange primary on white with deep-charcoal ' +
    'text, a two-row header (utility bar, big search with category dropdown, cart & wishlist) and a ' +
    'category bar with an "All categories" mega-menu. Compact rounded cards, promo badges, flash deals ' +
    'with countdown, product tabs, promo banner grid, brands, testimonials and blog — every block from ' +
    'the shared section library and editable in the customizer.',
  author: 'Sellchaze',
  archetype: 'Marketplace',
  category: 'general',
  tags: ['marketplace', 'multi-category', 'salla-style', 'arabic', 'dense', 'orange', 'deals'],
  previewImage: '/media/theme-previews/bazaar.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'mega-menu', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'countdown', 'blog', 'reviews'],
  minEngineVersion: '1.0.0',
  settingsSchema: bazaarSettingsSchema,
};
