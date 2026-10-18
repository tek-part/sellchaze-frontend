import type { ThemeSettingsSchema, ThemeSettings, DesignTokens } from '../../theme-engine/types';
import { hypeSettings, hypeTokens } from '../hype-perfumes/settings';

export const fashionSettings: ThemeSettingsSchema = hypeSettings.filter(field => field.id !== 'show_newsletter').map(field => field.type === 'color' && field.id === 'primary_color' ? { ...field, default: '#000000' } : field);
export function fashionTokens(settings: ThemeSettings): DesignTokens {
  const tokens = hypeTokens({ ...settings, primary_color: settings['primary_color'] ?? '#000000' });
  return { ...tokens, typography: { ...tokens.typography, fontSans: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }, spacing: { ...tokens.spacing, gutter: '34px' } };
}
