/**
 * Maison — home décor, lighting, textiles, kitchenware and gifts for the home · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { maisonSettingsSchema } from './settings';

export const maisonManifest: ThemeManifest = {
  id: 'maison',
  name: 'Maison',
  version: '1.0.0',
  description:
    'A warm, editorial home-décor theme: linen and terracotta (or olive) palettes, a serif display over a soft sans, ' +
    'magazine-style asymmetric grids, shop-the-room hotspots, shop-by-room tiles, a seasonal mood board, material & care ' +
    'notes and a gift guide by price band — built on the shared section library.',
  author: 'Sellchaze',
  archetype: 'Home Decor',
  category: 'home-decor',
  tags: ['home-decor', 'lighting', 'textiles', 'kitchenware', 'gifts', 'editorial', 'warm', 'terracotta', 'olive', 'arabic'],
  previewImage: '/media/theme-previews/maison.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'lookbook', 'reviews'],
  minEngineVersion: '1.0.0',
  settingsSchema: maisonSettingsSchema,
};
