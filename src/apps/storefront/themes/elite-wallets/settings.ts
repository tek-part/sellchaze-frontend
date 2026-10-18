import type { ThemeSettingsSchema, ThemeSettings, DesignTokens } from '../../theme-engine/types';
import { hypeSettings, hypeTokens } from '../hype-perfumes/settings';
export const walletSettings: ThemeSettingsSchema = [
  ...hypeSettings.filter(field => field.id !== 'show_newsletter').map(field => field.type === 'color' && field.id === 'primary_color' ? { ...field, default: '#111111' } : field),
  { id: 'announcement', type: 'text', label: 'Announcement', group: 'Header', translatable: true, default: { en: 'Discover the new collection', ar: 'اكتشف المجموعة الجديدة' } },
];
export function walletTokens(settings: ThemeSettings): DesignTokens {
  const base = hypeTokens({ ...settings, primary_color: settings['primary_color'] ?? '#111111' });
  return { ...base, typography: { ...base.typography, fontSans: '"Instrument Sans","IBM Plex Sans Arabic",sans-serif', fontSerif: 'Georgia,"IBM Plex Sans Arabic",serif' }, spacing: { ...base.spacing, gutter: '32px' } };
}
