/**
 * Theme 04 — Rouge · Luminous Beauty Commerce · manifest (metadata + capabilities + settings schema).
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { rougeSettingsSchema } from './settings';

export const rougeManifest: ThemeManifest = {
  id: 'rouge',
  name: 'Rouge — Luminous Beauty',
  version: '1.0.0',
  description:
    'Editorial luxury beauty & cosmetics — a warm porcelain canvas lit from within, a confident ' +
    'rouge primary with gilded-rose flourishes, a high-contrast didone display serif over a warm ' +
    'humanist sans, pillowy 16–24px radii, soft rose-bloom elevation, a luminous focus glow, and ' +
    'generous couture spacing. Shade-first merchandising for cosmetics.',
  author: 'Sellchaze',
  archetype: 'Luxury Beauty',
  tags: ['beauty', 'cosmetics', 'luxury', 'editorial', 'feminine', 'shade-variants'],
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: {
    colorSchemes: ['light', 'dark'],
  },
  // Declarative — the engine/UX feature-detect (never name-checked). A store without a shade
  // catalog simply never lights the shade-variants paths. Declared only where a shipping surface
  // backs the capability; `mega-menu`, `compare` and `quick-view` are not built here yet.
  capabilities: [
    'rtl',
    'dark-mode',
    'search-overlay',
    'cart-drawer',
    'wishlist',
    'reviews',
    'newsletter',
    'countdown',
    'lookbook',
    'instagram',
  ],
  minEngineVersion: '1.0.0',
  settingsSchema: rougeSettingsSchema,
};
