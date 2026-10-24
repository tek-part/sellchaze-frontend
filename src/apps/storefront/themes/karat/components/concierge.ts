/**
 * The concierge contact — the theme's `whatsapp_number` setting, else the store's own phone. Used by
 * the header link, the gold-rate notice, the concierge section and the footer. Empty when the store
 * has neither, in which case callers hide their WhatsApp affordance.
 */
import { useThemeSettings } from '../../../theme-engine/context';
import { useStore } from '../../../state/store-context';

export function useConciergePhone(): string {
  const settings = useThemeSettings();
  const { store } = useStore();
  const own = typeof settings['whatsapp_number'] === 'string' ? settings['whatsapp_number'].trim() : '';
  return own || store.phone?.trim() || '';
}
