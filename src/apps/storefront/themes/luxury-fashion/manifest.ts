/**
 * Theme 01 — Modern Luxury Fashion · manifest (metadata + capabilities + settings schema).
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { luxurySettingsSchema } from './settings';

export const luxuryManifest: ThemeManifest = {
  id: 'luxury-fashion',
  name: 'Modern Luxury Fashion',
  version: '1.0.0',
  description:
    'Editorial high-fashion minimalism — warm-ivory whitespace, a high-contrast serif over a ' +
    'quiet grotesque, full-bleed photography, sharp corners, hairline rules, and a single ' +
    'champagne-gold flourish. Timeless, premium, Apple-quality.',
  author: 'Sellchaze',
  archetype: 'Luxury Fashion',
  tags: ['luxury', 'fashion', 'editorial', 'minimal', 'premium'],
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: {
    colorSchemes: ['light', 'dark'],
  },
  // Capabilities implemented today — declared only when a shipping surface actually backs them, so
  // `hasCapability()` gating is truthful. `quick-view`, `compare` and `newsletter` have components
  // but no consuming surface yet; they are declared once wired. `mega-menu` and `blog` are not built.
  capabilities: [
    'rtl',
    'dark-mode',
    'search-overlay',
    'cart-drawer',
    'wishlist',
    'reviews',
    'countdown',
    'lookbook',
    'instagram',
  ],
  minEngineVersion: '1.0.0',
  settingsSchema: luxurySettingsSchema,
};
