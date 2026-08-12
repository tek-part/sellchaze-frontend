/**
 * Theme 02 — Voltage · Tech Commerce · manifest (metadata + capabilities + settings schema).
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { voltageSettingsSchema } from './settings';

export const voltageManifest: ThemeManifest = {
  id: 'voltage',
  name: 'Voltage — Tech Commerce',
  version: '1.0.0',
  description:
    'High-contrast, spec-confident tech commerce — dark-first carbon canvas, an electric duo of ' +
    'voltage-cyan and signal-lime, a geometric grotesque with tabular numerals for every price and ' +
    'spec, 10–12px radii, neon focus glow, and dense comparison-led layouts. The deliberate ' +
    'antithesis of the editorial fashion theme.',
  author: 'Sellchaze',
  archetype: 'Tech Commerce',
  tags: ['tech', 'electronics', 'dark', 'high-contrast', 'spec-led'],
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: {
    colorSchemes: ['dark', 'light'],
  },
  // Declared only where a shipping surface backs the capability. `mega-menu` is not built.
  capabilities: [
    'rtl',
    'dark-mode',
    'search-overlay',
    'cart-drawer',
    'wishlist',
    'compare',
    'quick-view',
    'reviews',
    'newsletter',
    'countdown',
    'blog',
  ],
  minEngineVersion: '1.0.0',
  settingsSchema: voltageSettingsSchema,
};
