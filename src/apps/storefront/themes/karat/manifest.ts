/**
 * Karat — fine jewellery, gold, diamonds and watches · manifest.
 */
import { CURRENT_MANIFEST_SCHEMA_VERSION } from '../../theme-engine/migration';
import type { ThemeManifest } from '../../theme-engine/types';
import { karatSettingsSchema } from './settings';

export const karatManifest: ThemeManifest = {
  id: 'karat',
  name: 'Karat',
  version: '1.0.0',
  description:
    'A quiet-luxury theme for gold souq stores, fine jewellery boutiques and watch dealers: emerald, onyx ' +
    'or ivory palettes with a single champagne-gold accent, Cormorant display type, arched editorial ' +
    'tiles by metal and stone, a gift finder, a craftsmanship and certification block, a merchant-written ' +
    'gold-rate notice and a WhatsApp / appointment concierge. Cards show metal, karat and weight.',
  author: 'Sellchaze',
  archetype: 'Fine Jewellery',
  category: 'jewelry',
  tags: ['jewelry', 'jewellery', 'gold', 'diamonds', 'watches', 'luxury', 'emerald', 'ivory', 'editorial', 'arabic', 'rtl'],
  previewImage: '/media/theme-previews/karat.jpg',
  schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION,
  supports: { colorSchemes: ['light', 'dark'] },
  capabilities: ['rtl', 'search-overlay', 'cart-drawer', 'wishlist', 'quick-add', 'newsletter'],
  minEngineVersion: '1.0.0',
  settingsSchema: karatSettingsSchema,
};
