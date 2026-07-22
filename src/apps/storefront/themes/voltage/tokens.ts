/**
 * Theme 02 — Voltage · Tech Commerce · design tokens (base).
 *
 * Dark-first, high-contrast tech commerce: near-black carbon canvas, an electric duo of
 * voltage-cyan + signal-lime, a geometric grotesque with tabular numerals, 10–12px radii on
 * elevated cards, neon focus glow. Values transcribed from the frozen documentation
 * (docs/themes/theme-02/03-theme-tokens.md). Do NOT re-tune here — the docs are the source of truth.
 *
 * Completely independent of Theme 01 (ivory fashion) — no value, family, or radius is shared.
 */
import type { DesignTokens } from '../../theme-engine/types';

export const voltageBaseTokens = {
  color: {
    // Dark — the default map (Voltage's identity).
    dark: {
      primary: '#22D3EE',
      onPrimary: '#04121A',
      accent: '#A3E635',
      accentInk: '#BEF264',
      bg: '#0B0F17',
      surface: '#141B27',
      surface2: '#1C2735',
      text: '#EAF1FA',
      muted: '#93A4BC',
      border: '#243245',
      borderStrong: '#33475F',
      sale: '#FB7185',
      success: '#34D399',
      danger: '#F87171',
      warning: '#FBBF24',
      info: '#38BDF8',
      scrim: 'rgba(4,8,15,.66)',
      scrimSoft: 'rgba(4,8,15,.4)',
    },
    // Light — secondary map (AA-safe: cyan/lime darkened for contrast on light).
    light: {
      primary: '#0E7490',
      onPrimary: '#FFFFFF',
      accent: '#4D7C0F',
      accentInk: '#3F6212',
      bg: '#F4F7FB',
      surface: '#FFFFFF',
      surface2: '#EDF2F8',
      text: '#0B1220',
      muted: '#566072',
      border: '#DDE5EF',
      borderStrong: '#C3CEDD',
      sale: '#E11D48',
      success: '#059669',
      danger: '#DC2626',
      warning: '#B45309',
      info: '#0284C7',
      scrim: 'rgba(11,18,32,.5)',
      scrimSoft: 'rgba(11,18,32,.28)',
    },
  },
  typography: {
    fontSans: "'Space Grotesk','Chakra Petch','Inter',system-ui,-apple-system,'Segoe UI',sans-serif",
    // Voltage has no serif — "headings" use the geometric grotesque display face.
    fontSerif: "'Space Grotesk','Chakra Petch','Inter',system-ui,sans-serif",
    fontMono: "'JetBrains Mono','IBM Plex Mono',ui-monospace,'SFMono-Regular',monospace",
    fontArabic: "'Rubik','Noto Kufi Arabic','Cairo',sans-serif",
    fontSize: {
      '4xl': 'clamp(40px, 6vw, 72px)',
      '3xl': 'clamp(30px, 4vw, 52px)',
      '2xl': 'clamp(24px, 3vw, 36px)',
      xl: 'clamp(20px, 2vw, 26px)',
      lg: '20px',
      md: '18px',
      base: '16px',
      sm: '14px',
      xs: '12px',
    },
    lineHeight: '1.5',
    lineHeightTight: '1.08',
    trackingEyebrow: '.12em',
    trackingCaps: '.02em',
  },
  spacing: {
    scale: {
      sp0: '0',
      sp1: '4px',
      sp2: '8px',
      sp3: '12px',
      sp4: '16px',
      sp5: '20px',
      sp6: '24px',
      sp7: '32px',
      sp8: '40px',
      sp9: '48px',
      sp10: '64px',
      sp11: '80px',
      sp12: '112px',
    },
    sectionY: 'clamp(56px, 8vw, 120px)',
    gutter: 'clamp(16px, 4vw, 64px)',
    gridGap: 'clamp(12px, 1.6vw, 24px)',
    stack: '20px',
    container: '1520px',
    containerNarrow: '720px',
    tap: '44px',
  },
  radius: {
    sm: '6px',
    base: '10px',
    lg: '16px',
    pill: '999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,.4)',
    base: '0 10px 34px rgba(0,0,0,.5)',
    lg: '0 28px 80px rgba(0,0,0,.62)',
    focus: '0 0 0 3px rgba(34,211,238,.55)',
    inset: 'inset 0 -1px 0 var(--border)',
  },
  motion: {
    ease: 'cubic-bezier(.2, .8, .2, 1)',
    easeInOut: 'cubic-bezier(.65, 0, .35, 1)',
    easeEmphasis: 'cubic-bezier(.16, 1, .3, 1)',
    transition: '200ms',
    transitionSlow: '400ms',
    transitionFast: '120ms',
  },
  size: {
    iconSm: '18px',
    iconMd: '20px',
    iconLg: '26px',
  },
  zIndex: {
    base: 0,
    sticky: 100,
    header: 200,
    dropdown: 300,
    overlay: 400,
    drawer: 500,
    modal: 600,
    toast: 700,
  },
  breakpoints: {
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} satisfies DesignTokens;
