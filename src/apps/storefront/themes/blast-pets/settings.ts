import type { ThemeSettingsSchema, ThemeSettings, DesignTokens } from '../../theme-engine/types';
import { naseemBaseTokens } from '../naseem/tokens';

export const petsSettings: ThemeSettingsSchema = [
  { id: 'primary_color', type: 'color', label: 'Navigation and purchase accent', group: 'Colors', default: '#FDAE03' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FFFFFF' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#111111' },
  { id: 'announcement', type: 'text', label: 'Announcement', group: 'Header', translatable: true, default: { en: 'Welcome to our store', ar: 'مرحبًا بك في متجرنا' } },
  { id: 'address', type: 'textarea', label: 'Address', group: 'Footer', translatable: true, default: '' },
];
const color = (s: ThemeSettings, key: string, fallback: string): string => typeof s[key] === 'string' && /^#[\da-f]{6}$/i.test(s[key]) ? s[key] : fallback;
export function petsTokens(s: ThemeSettings): DesignTokens {
  const primary = color(s, 'primary_color', '#FDAE03');
  return { ...naseemBaseTokens,
    color: { light: { ...naseemBaseTokens.color.light, primary, onPrimary: '#111111', accent: primary, accentInk: '#875700', bg: color(s, 'background_color', '#FFFFFF'), surface: '#FFFFFF', surface2: '#FFF8E5', text: color(s, 'text_color', '#111111'), muted: '#666666', border: '#E4E4E4', sale: '#E60013' }, dark: { ...naseemBaseTokens.color.dark } },
    typography: { ...naseemBaseTokens.typography, fontSans: 'Jost,"IBM Plex Sans Arabic",sans-serif', fontArabic: '"IBM Plex Sans Arabic",Jost,sans-serif', fontSerif: 'Georgia,serif', lineHeight: '1.5' },
    spacing: { ...naseemBaseTokens.spacing, container: '1440px', gutter: '20px', sectionY: '48px', gridGap: '24px' },
    radius: { sm: '4px', base: '8px', lg: '16px', pill: '999px' },
  };
}
