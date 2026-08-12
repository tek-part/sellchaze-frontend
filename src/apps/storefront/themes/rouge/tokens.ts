/**
 * Theme 04 — Rouge · Luminous Beauty Commerce · design tokens (base).
 *
 * Light-first luxury beauty: warm porcelain canvas that reads as *lit*, a confident Rouge primary,
 * a gilded-rose metallic accent, hot-petal for urgency, jade for reassurance. Depth comes from tint
 * layering + soft rose bloom, never hard borders. Values transcribed from the frozen documentation
 * (docs/themes/theme-04/03-theme-tokens.md). The docs are the source of truth — do NOT re-tune here.
 *
 * Completely independent of Themes 01–03 — no value, family, radius, or class is shared. Tokens
 * beyond the engine's fixed `DesignTokens` set (bloom, glow, gilt, surface-3, primary-soft, …) are
 * declared statically in `theme.css`, per-scheme via `[data-theme]`, since the engine only projects
 * this closed set.
 */
import type { DesignTokens } from '../../theme-engine/types';

export const rougeBaseTokens = {
  color: {
    // Light — the default map (Rouge's identity: luminous porcelain).
    light: {
      primary: '#B23052',
      onPrimary: '#FFF4F6',
      accent: '#C79A6D',
      // AA-safe gilt for *text*/underlines (the bright gilt fails small-text contrast on light).
      accentInk: '#895B32',
      bg: '#FBF5F3',
      surface: '#FFFFFF',
      surface2: '#FAF0EC',
      text: '#2B1B20',
      // Mauve-gray secondary text. Nudged darker from the spec #8C767B to meet WCAG AA (4.5:1) on
      // both --bg (4.6:1) and --surface (4.97:1) for small meta/caption text (QA audit, 2026-07-16).
      muted: '#765D64',
      border: '#EFDFD9',
      borderStrong: '#E2C9C0',
      sale: '#A62D50',
      success: '#4FA87E',
      danger: '#D45A5A',
      warning: '#D9A036',
      info: '#6E93C8',
      scrim: 'rgba(43,27,32,.44)',
      scrimSoft: 'rgba(43,27,32,.24)',
    },
    // Dark — "Boudoir": a mood shift to velvet aubergine, not an inversion. Rose lifts, gilt warms.
    dark: {
      primary: '#E8829B',
      onPrimary: '#2A0E16',
      accent: '#D9B382',
      accentInk: '#E8C79A',
      bg: '#170F13',
      surface: '#241820',
      surface2: '#2E2029',
      text: '#F6E9EC',
      muted: '#B6A0A8',
      border: '#382730',
      borderStrong: '#4A3540',
      sale: '#F6789A',
      success: '#6FC79C',
      danger: '#E88A8A',
      warning: '#E7BC63',
      info: '#8FB2E0',
      scrim: 'rgba(0,0,0,.6)',
      scrimSoft: 'rgba(0,0,0,.4)',
    },
  },
  typography: {
    // Warm humanist sans for UI/body.
    fontSans:
      "'Mundial','Graphik','Neue Haas Grotesk Text','Inter',system-ui,-apple-system,'Segoe UI',sans-serif",
    // High-contrast didone display serif for headlines, product names, and prices (≥18px only).
    fontSerif: "'Reckless Neue','Noe Display','GT Super Display','Playfair Display',Georgia,serif",
    // Rare: coupon codes / SKUs.
    fontMono: "'IBM Plex Mono',ui-monospace,'SFMono-Regular',monospace",
    fontArabic: "'Reem Kufi','Baloo Bhaijaan 2','Noto Naskh Arabic',sans-serif",
    fontSize: {
      '4xl': 'clamp(48px, 7vw, 92px)',
      '3xl': 'clamp(36px, 5vw, 60px)',
      '2xl': 'clamp(28px, 3.6vw, 42px)',
      xl: 'clamp(22px, 2.4vw, 28px)',
      lg: '20px',
      md: '18px',
      base: '16px',
      sm: '14px',
      xs: '12px',
    },
    lineHeight: '1.6',
    lineHeightTight: '1.1',
    trackingEyebrow: '.18em',
    trackingCaps: '.06em',
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
      sp9: '56px',
      sp10: '72px',
      sp11: '96px',
      sp12: '140px',
    },
    sectionY: 'clamp(72px, 11vw, 176px)',
    gutter: 'clamp(20px, 5vw, 88px)',
    gridGap: 'clamp(16px, 2.2vw, 36px)',
    stack: '24px',
    container: '1440px',
    containerNarrow: '760px',
    tap: '44px',
  },
  radius: {
    sm: '8px',
    base: '16px',
    lg: '24px',
    pill: '999px',
  },
  shadow: {
    sm: '0 2px 10px rgba(43,27,32,.06)',
    base: '0 14px 44px rgba(178,48,82,.10)',
    lg: '0 32px 90px rgba(43,27,32,.18)',
    focus: '0 0 0 4px rgba(178,48,82,.28)',
    inset: 'inset 0 -1px 0 var(--border)',
  },
  motion: {
    ease: 'cubic-bezier(.22, 1, .36, 1)',
    easeInOut: 'cubic-bezier(.62, 0, .38, 1)',
    easeEmphasis: 'cubic-bezier(.16, 1, .3, 1)',
    transition: '360ms',
    transitionSlow: '560ms',
    transitionFast: '180ms',
  },
  size: {
    iconSm: '18px',
    iconMd: '22px',
    iconLg: '28px',
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
