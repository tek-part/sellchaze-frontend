import type { DesignTokens, ThemeSettings } from '../../theme-engine/types';
import { naseemBaseTokens } from '../naseem/tokens';

const color = (s: ThemeSettings, key: string, fallback: string): string => typeof s[key] === 'string' && /^#[\da-f]{6}$/i.test(s[key]) ? s[key] : fallback;
export function eliteTokens(s: ThemeSettings): DesignTokens {
  const primary = color(s, 'primary_color', '#C8AA62');
  const bg = color(s, 'background_color', '#EFEFEF');
  const font = s['body_font'] === 'IBM Plex Sans Arabic' ? '"IBM Plex Sans Arabic",sans-serif' : s['body_font'] === 'system' ? 'system-ui,sans-serif' : '"Instrument Sans","IBM Plex Sans Arabic",sans-serif';
  return { ...naseemBaseTokens,
    color: { light: { ...naseemBaseTokens.color.light, primary, onPrimary: '#111111', accent: primary, accentInk: '#111111', bg, surface: '#FFFFFF', surface2: bg, text: color(s, 'text_color', '#111111'), border: '#D8D8D8', muted: '#6B6B6B', sale: '#B8336A' }, dark: { ...naseemBaseTokens.color.dark } },
    typography: { ...naseemBaseTokens.typography, fontSans: font, fontArabic: font, fontSerif: 'ui-serif,Georgia,Cambria,"Times New Roman",Times,serif', lineHeight: '1.5' },
    spacing: { ...naseemBaseTokens.spacing, container: '100%', gutter: '32px', sectionY: '60px', gridGap: '24px' },
    radius: { sm: '0px', base: '0px', lg: '0px', pill: '999px' },
    motion: { ...naseemBaseTokens.motion, transition: '300ms', transitionFast: '150ms', transitionSlow: '650ms' },
  };
}
