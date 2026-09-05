/**
 * Fresh (فريش) — grocery / food / organic market theme · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { freshSettingsSchema } from './settings';

export const freshManifest: ThemeManifest = {
  id: 'fresh',
  name: 'Fresh — فريش',
  version: '1.0.0',
  description:
    'A friendly grocery & fresh-market theme: green primary with a lime accent on a cream canvas, ' +
    'pill shapes, a delivery-time promise in the header, big quick-add buttons with quantity ' +
    'steppers on cards, category circles, weekly deals with a countdown and a sticky bottom tab bar ' +
    'on phones — built on the shared section library so every block is editable in the customizer.',
  author: 'Sellchaze',
  archetype: 'Grocery & Food',
  category: 'food',
  tags: ['grocery', 'food', 'organic', 'market', 'fresh', 'green', 'arabic', 'salla-style'],
  previewImage: '/media/theme-previews/fresh.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter', 'countdown', 'blog'],
  minEngineVersion: '1.0.0',
  settingsSchema: freshSettingsSchema,
};
