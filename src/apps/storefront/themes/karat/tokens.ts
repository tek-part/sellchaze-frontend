/**
 * Karat — base design tokens and the three palette presets.
 *
 * Quiet luxury: a deep ink-emerald night (default), an onyx black and an ivory day. Champagne gold
 * is the only accent and is used sparingly (hairlines, eyebrows, the primary button). Display type
 * is Cormorant Garamond for Latin with IBM Plex Sans Arabic carrying Arabic; body is Inter / IBM Plex
 * Sans Arabic. All families are self-hosted (`fonts-62f8c85d5005.css`).
 */
import type { DesignTokens } from '../../theme-engine/types';

export const ARABIC_STACK = "'IBM Plex Sans Arabic','Noto Sans Arabic','Segoe UI',Tahoma,system-ui,sans-serif";
export const DISPLAY_STACK = `'Cormorant Garamond','IBM Plex Sans Arabic',Georgia,'Times New Roman',${ARABIC_STACK}`;
export const BODY_STACK = `'Inter','IBM Plex Sans Arabic',system-ui,-apple-system,${ARABIC_STACK}`;

export type KaratPaletteId = 'emerald' | 'onyx' | 'ivory';

type Palette = DesignTokens['color']['light'];

/** Every palette meets WCAG AA for `text`/`muted` on `bg` and `surface`, and `onPrimary` on `primary`. */
export const KARAT_PALETTES: Readonly<Record<KaratPaletteId, Palette>> = {
  emerald: {
    primary: '#D5BC8A',
    onPrimary: '#0B1A15',
    accent: '#C7A76A',
    accentInk: '#DCC395',
    bg: '#0B1A15',
    surface: '#10231D',
    surface2: '#162E27',
    text: '#F3EEE3',
    muted: '#B4AE9F',
    border: '#22392F',
    borderStrong: '#36524A',
    sale: '#E9A79C',
    success: '#86D0A8',
    danger: '#F0A69B',
    warning: '#E7C46E',
    info: '#9CC6E4',
    scrim: 'rgba(4,10,8,.72)',
    scrimSoft: 'rgba(4,10,8,.45)',
  },
  onyx: {
    primary: '#D7C092',
    onPrimary: '#0B0B0C',
    accent: '#C8A96A',
    accentInk: '#DCC59A',
    bg: '#0B0B0C',
    surface: '#141415',
    surface2: '#1D1D1F',
    text: '#F2EEE6',
    muted: '#ABA69C',
    border: '#29292B',
    borderStrong: '#3B3B3E',
    sale: '#E8A097',
    success: '#86D0A8',
    danger: '#F0A69B',
    warning: '#E7C46E',
    info: '#9CC6E4',
    scrim: 'rgba(0,0,0,.74)',
    scrimSoft: 'rgba(0,0,0,.48)',
  },
  ivory: {
    primary: '#14332B',
    onPrimary: '#F8F4EC',
    accent: '#B8955A',
    accentInk: '#7A5C27',
    bg: '#F8F4EC',
    surface: '#FFFDF8',
    surface2: '#F0E9DC',
    text: '#1A1F1C',
    muted: '#5D584E',
    border: '#E2D8C6',
    borderStrong: '#CBBCA2',
    sale: '#9B2E24',
    success: '#2F6B4B',
    danger: '#A3321F',
    warning: '#8A6514',
    info: '#2C5D82',
    scrim: 'rgba(20,24,22,.55)',
    scrimSoft: 'rgba(20,24,22,.3)',
  },
};

export const karatBaseTokens = {
  color: { light: KARAT_PALETTES.emerald, dark: KARAT_PALETTES.emerald },
  typography: {
    fontSans: BODY_STACK,
    fontSerif: DISPLAY_STACK,
    fontMono: "'IBM Plex Mono',ui-monospace,SFMono-Regular,monospace",
    fontArabic: ARABIC_STACK,
    fontSize: {
      '4xl': 'clamp(44px, 6.4vw, 88px)',
      '3xl': 'clamp(34px, 4.4vw, 58px)',
      '2xl': 'clamp(27px, 3.2vw, 40px)',
      xl: 'clamp(21px, 2.2vw, 27px)',
      lg: '19px',
      md: '17px',
      base: '15px',
      sm: '13.5px',
      xs: '12px',
    },
    lineHeight: '1.7',
    lineHeightTight: '1.08',
    trackingEyebrow: '.24em',
    trackingCaps: '.14em',
  },
  spacing: {
    scale: {
      sp0: '0', sp1: '4px', sp2: '8px', sp3: '12px', sp4: '16px', sp5: '20px', sp6: '24px',
      sp7: '32px', sp8: '40px', sp9: '56px', sp10: '72px', sp11: '96px', sp12: '128px',
    },
    sectionY: 'clamp(56px, 8vw, 120px)',
    gutter: 'clamp(16px, 4vw, 48px)',
    gridGap: 'clamp(14px, 2vw, 28px)',
    stack: '24px',
    container: '1320px',
    containerNarrow: '760px',
    tap: '44px',
  },
  radius: { sm: '0px', base: '0px', lg: '0px', pill: '999px' },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,.08)',
    base: '0 10px 30px rgba(0,0,0,.12)',
    lg: '0 30px 70px rgba(0,0,0,.28)',
    focus: '0 0 0 2px var(--bg), 0 0 0 4px var(--accent)',
    inset: 'inset 0 -1px 0 var(--border)',
  },
  motion: {
    ease: 'cubic-bezier(.22, .61, .36, 1)',
    easeInOut: 'cubic-bezier(.65, 0, .35, 1)',
    easeEmphasis: 'cubic-bezier(.16, 1, .3, 1)',
    transition: '320ms',
    transitionSlow: '900ms',
    transitionFast: '180ms',
  },
  size: { iconSm: '18px', iconMd: '20px', iconLg: '28px' },
  zIndex: { base: 0, sticky: 100, header: 200, dropdown: 300, overlay: 400, drawer: 500, modal: 600, toast: 700 },
  breakpoints: { sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
} satisfies DesignTokens;
