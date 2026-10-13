import type { ThemeSettingsSchema, ThemeSettings, DesignTokens } from '../../theme-engine/types';
import { naseemBaseTokens } from '../naseem/tokens';

export const pureSettings: ThemeSettingsSchema = [
  { id: 'primary_color', type: 'color', label: 'Accent', group: 'Colors', default: '#834523' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FAF7F2' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#6C432D' },
  { id: 'announcement', type: 'text', label: 'Announcement', group: 'Header', translatable: true, default: { ar: 'مرحبًا بك في متجرنا', en: 'Welcome to our store' } },
  { id: 'show_announcement', type: 'toggle', label: 'Announcement strip', group: 'Header', default: true },
  { id: 'show_newsletter', type: 'toggle', label: 'Footer newsletter', group: 'Footer', default: true },
  { id: 'address', type: 'textarea', label: 'Address', group: 'Footer', translatable: true, default: '' },
  { id: 'hours', type: 'text', label: 'Customer care hours', group: 'Footer', translatable: true, default: '' },
];
function color(s: ThemeSettings, key: string, fallback: string): string { const value = s[key]; return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : fallback; }
export function pureTokens(s: ThemeSettings): DesignTokens {
  const primary = color(s, 'primary_color', '#834523'); const bg = color(s, 'background_color', '#FAF7F2');
  return { ...naseemBaseTokens,
    color: { light: { ...naseemBaseTokens.color.light, primary, onPrimary: '#FFFFFF', accent: primary, accentInk: primary, bg, surface: bg, surface2: '#F1E9E0', text: color(s, 'text_color', '#6C432D'), border: '#DDD1C5', muted: '#846F62', sale: primary }, dark: { ...naseemBaseTokens.color.dark } },
    typography: { ...naseemBaseTokens.typography, fontSans: 'Jost,"IBM Plex Sans Arabic",sans-serif', fontArabic: '"IBM Plex Sans Arabic",Jost,sans-serif', fontSerif: 'Jost,"IBM Plex Sans Arabic",sans-serif', lineHeight: '1.6' },
    spacing: { ...naseemBaseTokens.spacing, container: '100%', gutter: '40px', sectionY: '80px', gridGap: '24px' },
    radius: { sm: '8px', base: '16px', lg: '24px', pill: '999px' },
    motion: { ...naseemBaseTokens.motion, transition: '300ms', transitionSlow: '600ms' },
  };
}
