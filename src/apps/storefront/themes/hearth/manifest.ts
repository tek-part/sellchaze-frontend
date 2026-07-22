/**
 * Theme 03 — Hearth · Home & Living · manifest (metadata + capabilities + settings schema).
 *
 * A warm, tactile home-retail identity. Bespoke components + sections; reuses only the frozen
 * platform contracts (docs/themes/theme-03/000-README). Distinct from Theme 01 (luxury fashion)
 * and Theme 02 (voltage / tech) — shares no visual DNA with either.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { hearthSettingsSchema } from './settings';

export const hearthManifest: ThemeManifest = {
  id: 'hearth',
  name: 'Hearth — Home & Living',
  version: '1.0.0',
  description:
    'Warm, tactile home retail — soft oat-and-clay canvas, terracotta + sage earthy accents, a ' +
    'warm humanist serif over a soft sans, large soft radii, and big room-context photography. ' +
    'Roomset heroes, shop-the-room, material swatches and dimension clarity.',
  author: 'SellChase',
  archetype: 'Furniture & Home',
  tags: ['furniture', 'home', 'living', 'warm', 'lifestyle', 'tactile'],
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: {
    colorSchemes: ['light', 'dark'],
  },
  // Declared only where a shipping surface backs the capability. `reviews`, `compare`, `quick-view`
  // and `mega-menu` are not built in this theme yet.
  capabilities: [
    'rtl',
    'dark-mode',
    'search-overlay',
    'cart-drawer',
    'wishlist',
    'newsletter',
    'lookbook',
  ],
  minEngineVersion: '1.0.0',
  settingsSchema: hearthSettingsSchema,
};
