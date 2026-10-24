/**
 * Glow — beauty, skincare and cosmetics theme · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { glowSettingsSchema } from './settings';

export const glowManifest: ThemeManifest = {
  id: 'glow',
  name: 'Glow',
  version: '1.0.0',
  description:
    'A beauty, skincare and cosmetics theme: airy porcelain pages with blush, nude or night palettes, ' +
    'Cormorant Garamond headings, product imagery framed in soft arches, shop-by-concern tiles, an ' +
    'ingredient spotlight, a step-by-step routine you can add to the bag in one tap, a results band ' +
    'built from real store numbers, and a trust strip the merchant switches on claim by claim.',
  author: 'Sellchaze',
  archetype: 'Beauty & Skincare',
  category: 'beauty',
  tags: ['beauty', 'skincare', 'cosmetics', 'makeup', 'haircare', 'blush', 'serif', 'arabic', 'rtl'],
  previewImage: '/media/theme-previews/glow.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'reviews', 'newsletter'],
  minEngineVersion: '1.0.0',
  settingsSchema: glowSettingsSchema,
};
