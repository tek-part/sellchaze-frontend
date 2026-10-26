import type { ThemeSettingsSchema, ThemeSettings, DesignTokens } from '../../theme-engine/types';
import { naseemBaseTokens } from '../naseem/tokens';

export const kidsSettings: ThemeSettingsSchema = [
  { id: 'primary_color', type: 'color', label: 'Navigation accent', group: 'Colors', default: '#1066DD' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FFFFFF' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#1A1A1A' },
  { id: 'address', type: 'textarea', label: 'Address', group: 'Footer', translatable: true, default: '' },
  { id: 'show_newsletter', type: 'toggle', label: 'Footer newsletter', group: 'Footer', default: true },
];
const color = (s: ThemeSettings, key: string, fallback: string): string => typeof s[key] === 'string' && /^#[\da-f]{6}$/i.test(s[key]) ? s[key] : fallback;
export function kidsTokens(s: ThemeSettings): DesignTokens {
  const primary = color(s, 'primary_color', '#1066DD');
  return { ...naseemBaseTokens,
    color: { light: { ...naseemBaseTokens.color.light, primary, onPrimary: '#FFFFFF', accent: primary, accentInk: primary, bg: color(s, 'background_color', '#FFFFFF'), surface: '#FFFFFF', surface2: '#F5F2ED', text: color(s, 'text_color', '#1A1A1A'), muted: '#666666', border: '#E7E7E7', sale: '#111111' }, dark: { ...naseemBaseTokens.color.dark } },
    typography: { ...naseemBaseTokens.typography, fontSans: '"DM Sans","IBM Plex Sans Arabic",sans-serif', fontArabic: '"IBM Plex Sans Arabic","DM Sans",sans-serif', fontSerif: 'Georgia,serif', lineHeight: '1.6' },
    spacing: { ...naseemBaseTokens.spacing, container: '1520px', gutter: '16px', sectionY: '64px', gridGap: '24px' },
    radius: { sm: '8px', base: '16px', lg: '24px', pill: '999px' },
    motion: { ...naseemBaseTokens.motion, transition: '300ms', transitionSlow: '600ms' },
  };
}
