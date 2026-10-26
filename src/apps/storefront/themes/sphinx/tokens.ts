import type { DesignTokens, ThemeSettings } from '../../theme-engine/types';
import { naseemBaseTokens } from '../naseem/tokens';

const system = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,"Helvetica Neue",sans-serif';
const color = (settings: ThemeSettings, key: string, fallback: string): string => typeof settings[key] === 'string' && /^#[\da-f]{6}$/i.test(settings[key]) ? settings[key] : fallback;
const font = (value: unknown): string => typeof value === 'string' && ['Raleway', 'Cairo', 'IBM Plex Sans Arabic'].includes(value) ? `'${value}',${system}` : system;
export function sphinxTokens(settings: ThemeSettings): DesignTokens {
  const primary = color(settings, 'primary_color', '#006C35');
  return {
    ...naseemBaseTokens,
    color: {
      light: { ...naseemBaseTokens.color.light, primary, onPrimary: '#FFFFFF', accent: primary, accentInk: primary, text: color(settings, 'text_color', '#131316'), bg: color(settings, 'background_color', '#FFFFFF'), surface: color(settings, 'background_color', '#FFFFFF'), surface2: '#F8F8F8', border: '#E5E7EB', borderStrong: '#D1D5DB', muted: '#6B6B6B', sale: color(settings, 'sale_color', '#D32F3A') },
      dark: { ...naseemBaseTokens.color.dark, primary: '#74D99D', onPrimary: '#0D2518', accent: '#74D99D', accentInk: '#74D99D' },
    },
    typography: { ...naseemBaseTokens.typography, fontSans: font(settings['body_font']), fontSerif: font(settings['heading_font']), fontArabic: system, lineHeight: '1.5', fontSize: { ...naseemBaseTokens.typography.fontSize, lg: '20px', base: '16px' } },
    spacing: { ...naseemBaseTokens.spacing, container: `${typeof settings['container_width'] === 'number' ? settings['container_width'] : 1316}px`, gutter: 'clamp(16px,3vw,40px)', gridGap: '24px', sectionY: '48px' },
    radius: { sm: '6px', base: '8px', lg: '24px', pill: '999px' },
    motion: { ...naseemBaseTokens.motion, transition: '300ms', transitionSlow: '500ms', transitionFast: '150ms' },
  };
}
