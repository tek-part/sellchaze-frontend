/**
 * Sahra — base design tokens. Two moods: "Sand" (warm ivory, ink primary, gold accent) and
 * "Charcoal" (deep ink canvas, gold primary, sand text). Serif headings, quiet sans body,
 * sharp corners by default, generous section rhythm.
 */
import type { DesignTokens } from '../../theme-engine/types';

export const GOLD = '#C9A24D';

export const ARABIC_SANS = "'Tajawal','IBM Plex Sans Arabic','Noto Sans Arabic',system-ui,sans-serif";
export const ARABIC_SERIF = "'Amiri','Noto Naskh Arabic','Scheherazade New',serif";

export const sahraBaseTokens = {
  color: {
    light: {
      primary: '#1C1A17',
      onPrimary: '#FBF8F3',
      accent: GOLD,
      accentInk: '#8A6A22',
      bg: '#FBF8F3',
      surface: '#FFFFFF',
      surface2: '#F3EDE2',
      text: '#1C1A17',
      muted: '#6F675C',
      border: '#E6DDCD',
      borderStrong: '#CDBFA6',
      sale: '#9B2C2C',
      success: '#2F6B4F',
      danger: '#9B2C2C',
      warning: '#B7791F',
      info: '#2C5282',
      scrim: 'rgba(20,18,15,.6)',
      scrimSoft: 'rgba(20,18,15,.35)',
    },
    dark: {
      primary: GOLD,
      onPrimary: '#14120F',
      accent: GOLD,
      accentInk: '#DDBE6E',
      bg: '#14120F',
      surface: '#1C1A17',
      surface2: '#242019',
      text: '#F2EBDD',
      muted: '#A89E8C',
      border: '#2F2A22',
      borderStrong: '#4A4234',
      sale: '#D77A7A',
      success: '#7BC29A',
      danger: '#D77A7A',
      warning: '#DDBE6E',
      info: '#8FB3E0',
      scrim: 'rgba(0,0,0,.7)',
      scrimSoft: 'rgba(0,0,0,.45)',
    },
  },
  typography: {
    fontSans: `'Inter',${ARABIC_SANS}`,
    fontSerif: `'Playfair Display',${ARABIC_SERIF}`,
    fontMono: "'IBM Plex Mono',ui-monospace,monospace",
    fontArabic: ARABIC_SANS,
    fontSize: {
      '4xl': 'clamp(40px, 7vw, 88px)',
      '3xl': 'clamp(32px, 5vw, 60px)',
      '2xl': 'clamp(28px, 3.4vw, 42px)',
      xl: 'clamp(22px, 2.4vw, 30px)',
      lg: '20px',
      md: '18px',
      base: '16px',
      sm: '14px',
      xs: '12px',
    },
    lineHeight: '1.7',
    lineHeightTight: '1.15',
    trackingEyebrow: '.22em',
    trackingCaps: '.12em',
  },
  spacing: {
    scale: {
      sp0: '0', sp1: '4px', sp2: '8px', sp3: '12px', sp4: '16px', sp5: '20px', sp6: '24px',
      sp7: '32px', sp8: '40px', sp9: '48px', sp10: '72px', sp11: '96px', sp12: '128px',
    },
    sectionY: 'clamp(64px, 9vw, 128px)',
    gutter: 'clamp(20px, 5vw, 56px)',
    gridGap: 'clamp(16px, 2.4vw, 32px)',
    stack: '28px',
    container: '1400px',
    containerNarrow: '840px',
    tap: '44px',
  },
  radius: { sm: '0px', base: '0px', lg: '0px', pill: '999px' },
  shadow: {
    sm: '0 1px 2px rgba(20,18,15,.06)',
    base: '0 10px 30px rgba(20,18,15,.10)',
    lg: '0 30px 70px rgba(20,18,15,.18)',
    focus: '0 0 0 3px rgba(201,162,77,.45)',
    inset: 'inset 0 -1px 0 var(--border)',
  },
  motion: {
    ease: 'cubic-bezier(.2, .8, .2, 1)',
    easeInOut: 'cubic-bezier(.65, 0, .35, 1)',
    easeEmphasis: 'cubic-bezier(.16, 1, .3, 1)',
    transition: '320ms',
    transitionSlow: '720ms',
    transitionFast: '160ms',
  },
  size: { iconSm: '18px', iconMd: '22px', iconLg: '28px' },
  zIndex: { base: 0, sticky: 100, header: 200, dropdown: 300, overlay: 400, drawer: 500, modal: 600, toast: 700 },
  breakpoints: { sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
} satisfies DesignTokens;
