import type { ThemeSettingsSchema, ThemeSettings, DesignTokens } from '../../theme-engine/types';
import { naseemBaseTokens } from '../naseem/tokens';

export const hypeSettings: ThemeSettingsSchema = [
  { id: 'primary_color', type: 'color', label: 'Accent', group: 'Colors', default: '#35161F' },
  { id: 'background_color', type: 'color', label: 'Background', group: 'Colors', default: '#FFFFFF' },
  { id: 'text_color', type: 'color', label: 'Text', group: 'Colors', default: '#131316' },
  { id: 'show_newsletter', type: 'toggle', label: 'Footer newsletter', group: 'Footer', default: true },
  { id: 'address', type: 'textarea', label: 'Address', group: 'Footer', translatable: true, default: '' },
];
function color(s: ThemeSettings, key: string, fallback: string): string { const v = s[key]; return typeof v === 'string' && /^#[\da-f]{6}$/i.test(v) ? v : fallback; }
export function hypeTokens(s: ThemeSettings): DesignTokens {
  const primary = color(s, 'primary_color', '#35161F'); const bg = color(s, 'background_color', '#FFFFFF');
  return { ...naseemBaseTokens,
    color: { light: { ...naseemBaseTokens.color.light, primary, onPrimary: '#FFFFFF', accent: primary, accentInk: primary, bg, surface: bg, surface2: '#F7F5F2', text: color(s, 'text_color', '#131316'), border: '#E9E5E2', muted: '#6B6666', sale: '#A4422D' }, dark: { ...naseemBaseTokens.color.dark } },
    typography: { ...naseemBaseTokens.typography, fontSans: 'Jost,"IBM Plex Sans Arabic",sans-serif', fontArabic: '"IBM Plex Sans Arabic",Jost,sans-serif', fontSerif: 'Newsreader,Georgia,"IBM Plex Sans Arabic",serif', lineHeight: '1.6' },
    spacing: { ...naseemBaseTokens.spacing, container: '100%', gutter: '24px', sectionY: '60px', gridGap: '20px' },
    radius: { sm: '0px', base: '0px', lg: '0px', pill: '999px' },
    motion: { ...naseemBaseTokens.motion, transition: '300ms', transitionSlow: '600ms' },
  };
}
