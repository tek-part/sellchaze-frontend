/**
 * Sahra (صحراء) — luxury perfume / jewellery / abaya / gifts theme · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { sahraSettingsSchema } from './settings';

export const sahraManifest: ThemeManifest = {
  id: 'sahra',
  name: 'Sahra — صحراء',
  version: '1.0.0',
  description:
    'A luxury theme for perfumes, jewellery, abayas and gifts: warm sand or deep charcoal canvas, ' +
    'gold accents, serif headings (Playfair Display / Amiri), thin gold rules, a centred minimal ' +
    'header, cinematic full-bleed hero, editorial image-with-text blocks and elegant hover-swap ' +
    'product cards — built entirely on the shared section library.',
  author: 'Sellchaze',
  archetype: 'Luxury Gifts',
  category: 'luxury',
  tags: ['luxury', 'perfume', 'jewellery', 'abaya', 'gifts', 'gold', 'dark', 'editorial', 'arabic', 'salla-style'],
  previewImage: '/media/theme-previews/sahra.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'reviews'],
  minEngineVersion: '1.0.0',
  settingsSchema: sahraSettingsSchema,
};
