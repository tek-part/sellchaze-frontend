/**
 * Glow — base design tokens. Three palettes share one token shape:
 *   blush — porcelain page, rose-tinted surfaces, aubergine-cocoa ink (default)
 *   nude  — warm sand surfaces, espresso ink
 *   night — deep plum-black page, blush ink (the "after dark" preset)
 * Headings are Cormorant Garamond (Latin) over IBM Plex Sans Arabic; body is Plus Jakarta Sans over
 * IBM Plex Sans Arabic. Every pair below is checked for WCAG AA text contrast in `glow.test.ts`.
 */
import type { DesignTokens } from '../../theme-engine/types';

export const ARABIC_STACK = "'IBM Plex Sans Arabic','Noto Sans Arabic',system-ui,sans-serif";
export const SERIF_STACK = `'Cormorant Garamond','IBM Plex Sans Arabic',Georgia,'Times New Roman',${ARABIC_STACK}`;
export const SANS_STACK = `'Plus Jakarta Sans','IBM Plex Sans Arabic',system-ui,-apple-system,'Segoe UI',${ARABIC_STACK}`;

export type GlowPaletteId = 'blush' | 'nude' | 'night';
export type GlowColors = DesignTokens['color']['light'];

export const GLOW_PALETTES: Readonly<Record<GlowPaletteId, GlowColors>> = {
  blush: {
    primary: '#3D2A2E',
    onPrimary: '#FFFFFF',
    accent: '#E7B9B3',
    accentInk: '#9A4A55',
    bg: '#FBF7F5',
    surface: '#FFFFFF',
    surface2: '#F5EAE6',
    text: '#2B1E1F',
    muted: '#6E5C5A',
    border: '#EADCD7',
    borderStrong: '#D6C1BA',
    sale: '#A8364C',
    success: '#2F6E4E',
    danger: '#A8364C',
    warning: '#9A6212',
    info: '#3F5F92',
    scrim: 'rgba(43,30,31,.55)',
    scrimSoft: 'rgba(43,30,31,.28)',
  },
  nude: {
    primary: '#4E3B2E',
    onPrimary: '#FFFFFF',
    accent: '#D9C2A7',
    accentInk: '#865A35',
    bg: '#F8F4EE',
    surface: '#FFFFFF',
    surface2: '#EFE5D9',
    text: '#2A221C',
    muted: '#6A5D52',
    border: '#E4D8CA',
    borderStrong: '#D0BFAC',
    sale: '#A3412B',
    success: '#2F6E4E',
    danger: '#A3412B',
    warning: '#9A6212',
    info: '#3F5F92',
    scrim: 'rgba(42,34,28,.55)',
    scrimSoft: 'rgba(42,34,28,.28)',
  },
  night: {
    primary: '#EDC1BB',
    onPrimary: '#241719',
    accent: '#C48A86',
    accentInk: '#EDC1BB',
    bg: '#171113',
    surface: '#201719',
    surface2: '#2A1F22',
    text: '#F5ECE8',
    muted: '#BDAAA6',
    border: '#3A2D31',
    borderStrong: '#55444A',
    sale: '#F2949F',
    success: '#7FCBA2',
    danger: '#F2949F',
    warning: '#E9B65F',
    info: '#9DB6E6',
    scrim: 'rgba(0,0,0,.7)',
    scrimSoft: 'rgba(0,0,0,.45)',
  },
};

export const glowBaseTokens = {
  color: { light: GLOW_PALETTES.blush, dark: GLOW_PALETTES.night },
  typography: {
    fontSans: SANS_STACK,
    fontSerif: SERIF_STACK,
    fontMono: "'IBM Plex Mono',ui-monospace,SFMono-Regular,monospace",
    fontArabic: ARABIC_STACK,
    fontSize: {
      '4xl': 'clamp(42px, 6.2vw, 84px)',
      '3xl': 'clamp(34px, 4.4vw, 58px)',
      '2xl': 'clamp(29px, 3.3vw, 44px)',
      xl: 'clamp(22px, 2.2vw, 28px)',
      lg: '19px',
      md: '17px',
      base: '15px',
      sm: '14px',
      xs: '12px',
    },
    lineHeight: '1.65',
    lineHeightTight: '1.08',
    trackingEyebrow: '.18em',
    trackingCaps: '.08em',
  },
  spacing: {
    scale: {
      sp0: '0', sp1: '4px', sp2: '8px', sp3: '12px', sp4: '16px', sp5: '20px', sp6: '24px',
      sp7: '32px', sp8: '40px', sp9: '48px', sp10: '64px', sp11: '88px', sp12: '120px',
    },
    sectionY: 'clamp(56px, 8vw, 112px)',
    gutter: 'clamp(16px, 4vw, 48px)',
    gridGap: 'clamp(14px, 2vw, 28px)',
    stack: '20px',
    container: '1320px',
    containerNarrow: '760px',
    tap: '44px',
  },
  radius: { sm: '6px', base: '12px', lg: '20px', pill: '999px' },
  shadow: {
    sm: '0 1px 2px rgba(61,42,46,.06)',
    base: '0 10px 30px rgba(61,42,46,.08)',
    lg: '0 24px 60px rgba(61,42,46,.16)',
    focus: '0 0 0 3px rgba(154,74,85,.35)',
    inset: 'inset 0 -1px 0 var(--border)',
  },
  motion: {
    ease: 'cubic-bezier(.22, .8, .24, 1)',
    easeInOut: 'cubic-bezier(.65, 0, .35, 1)',
    easeEmphasis: 'cubic-bezier(.16, 1, .3, 1)',
    transition: '240ms',
    transitionSlow: '520ms',
    transitionFast: '140ms',
  },
  size: { iconSm: '18px', iconMd: '22px', iconLg: '28px' },
  zIndex: { base: 0, sticky: 100, header: 200, dropdown: 300, overlay: 400, drawer: 500, modal: 600, toast: 700 },
  breakpoints: { sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
} satisfies DesignTokens;
