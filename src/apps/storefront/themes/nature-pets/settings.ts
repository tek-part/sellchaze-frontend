import type { ThemeSettings, DesignTokens } from '../../theme-engine/types';
import { kidsSettings, kidsTokens } from '../nature-kids/settings';
export const naturePetsSettings = kidsSettings.map(field => field.type === 'color' && field.id === 'primary_color' ? { ...field, default: '#A67500', label: 'Navigation accent' } : field);
export function naturePetsTokens(settings: ThemeSettings): DesignTokens {
  const base = kidsTokens({ ...settings, primary_color: settings['primary_color'] ?? '#A67500' });
  return { ...base, color: { ...base.color, light: { ...base.color.light, surface2: '#F5F2ED' } } };
}
