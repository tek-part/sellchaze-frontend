import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { sphinxSettingsSchema } from './settings';

export const sphinxManifest: ThemeManifest = {
  id: 'sphinx-v3', name: 'Sphinx V3', version: '1.0.0', author: 'Sellchaze',
  description: 'A green storefront with a category mosaic, featured category shelves, inline search, a cart drawer and mobile bottom navigation.',
  archetype: 'Furniture & Lifestyle', category: 'general', tags: ['furniture', 'green', 'classic', 'rtl'],
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0',
  supports: { colorSchemes: ['light', 'dark'] }, capabilities: ['rtl', 'dark-mode', 'cart-drawer', 'quick-add', 'newsletter'],
  settingsSchema: sphinxSettingsSchema,
};
