/**
 * Stride — sneakers, sportswear and fitness gear · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { strideSettingsSchema } from './settings';

export const strideManifest: ThemeManifest = {
  id: 'stride',
  name: 'Stride',
  version: '1.0.0',
  description:
    'A high-energy theme for sneaker, sportswear and fitness stores: night or court grounds with a volt ' +
    'or race-red accent, oversized slanted display type, drop countdowns, a size-chart finder, ' +
    'shop-by-sport tiles, a snap-scrolling new-drops rail and a kit builder — on a dense, grid-first ' +
    'product layout with colour dots and new / low-stock badges.',
  author: 'Sellchaze',
  archetype: 'Sports & Sneakers',
  category: 'sports',
  tags: ['sports', 'sneakers', 'sportswear', 'fitness', 'gym', 'streetwear', 'dark', 'volt', 'bold', 'arabic'],
  previewImage: '/media/theme-previews/stride.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'countdown', 'reviews'],
  minEngineVersion: '1.0.0',
  settingsSchema: strideSettingsSchema,
};
