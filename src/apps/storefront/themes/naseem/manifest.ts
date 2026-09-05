/**
 * Naseem (نسيم) — clean, modern general-store theme · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { naseemSettingsSchema } from './settings';

export const naseemManifest: ThemeManifest = {
  id: 'naseem',
  name: 'Naseem — نسيم',
  version: '1.0.0',
  description:
    'A light, airy general-store theme: blue primary, generous whitespace, Arabic-first typography, ' +
    'sticky search header, category circles, product tabs, flash deals and a newsletter band — ' +
    'built entirely on the shared section library so every block is editable in the customizer.',
  author: 'Sellchaze',
  archetype: 'General Store',
  category: 'general',
  tags: ['general', 'clean', 'modern', 'arabic', 'light', 'salla-style'],
  previewImage: '/media/theme-previews/naseem.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'countdown'],
  minEngineVersion: '1.0.0',
  settingsSchema: naseemSettingsSchema,
};
