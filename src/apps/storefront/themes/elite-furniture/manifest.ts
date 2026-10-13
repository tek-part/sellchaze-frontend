import type { ThemeManifest } from '../../theme-engine/types';
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import { eliteSettings } from './settings';

export const eliteManifest: ThemeManifest = {
  id: 'elite-furniture', name: 'Elite Furniture', version: '1.0.0', author: 'Sellchaze',
  description: 'An independent furniture storefront with a fixed centered header, cinematic hero, category tiles, featured shelves, image comparison and stacked product photography.',
  archetype: 'Furniture', category: 'general', tags: ['furniture', 'modern', 'editorial', 'rtl'],
  previewImage: '/media/theme-previews/elite-furniture.png',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION, minEngineVersion: '1.0.0',
  supports: { colorSchemes: ['light'] }, capabilities: ['rtl', 'cart-drawer', 'newsletter', 'countdown'], settingsSchema: eliteSettings,
};
