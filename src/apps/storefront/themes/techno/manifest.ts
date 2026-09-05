/**
 * Techno (تكنو) — electronics / gadgets store theme · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { technoSettingsSchema } from './settings';

export const technoManifest: ThemeManifest = {
  id: 'techno',
  name: 'Techno — تكنو',
  version: '1.0.0',
  description:
    'An electronics & gadgets theme: navy header and footer, electric-blue primary with cyan accents, ' +
    'light-grey page, sharp technical typography, spec chips and price/discount emphasis on cards, ' +
    'compare tray, category mega-menu, support hotline, trust bar, flash deals with countdown and a ' +
    'brand wall — built entirely on the shared section library.',
  author: 'Sellchaze',
  archetype: 'Electronics',
  category: 'electronics',
  tags: ['electronics', 'tech', 'gadgets', 'navy', 'blue', 'spec-led', 'arabic', 'salla-style'],
  previewImage: '/media/theme-previews/techno.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'dark-mode', 'mega-menu', 'search-overlay', 'cart-drawer', 'wishlist', 'compare', 'quick-add', 'newsletter', 'countdown'],
  minEngineVersion: '1.0.0',
  settingsSchema: technoSettingsSchema,
};
