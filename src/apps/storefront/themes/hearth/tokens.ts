/**
 * Theme 03 — Hearth · Home & Living · design tokens (base).
 *
 * Values are transcribed from the frozen design documentation (docs/themes/theme-03/04-theme-tokens).
 * Warm-light-first: `color.light` is the default map, `color.dark` a cozy-evening secondary. Every
 * value reads through the engine's fixed `DesignTokens` shape and is projected to `--token` CSS
 * custom properties by the engine — the theme CSS references only those. Do NOT re-tune here; the
 * documentation is the source of truth.
 *
 * Identity: oat canvas · walnut ink · terracotta acts / sage natural · humanist serif + soft sans ·
 * large soft 16–24px radii · warm diffuse shadow (no glow) · gentle weighted motion.
 */
import type { DesignTokens } from '../../theme-engine/types';

export const hearthBaseTokens = {
  color: {
    light: {
      primary: '#A4472F', // Deep terracotta — AA-safe for actions and small text
      onPrimary: '#FCF6EC', // cream on terracotta
      accent: '#6E7B54', // Sage — natural / eco / secondary
      accentInk: '#566043', // AA-safe sage for text on the warm canvas
      bg: '#F3EBDE', // Oat — warm page canvas
      surface: '#FBF7F0', // Cream — cards / raised panels
      surface2: '#EFE7D9', // Linen — inputs, secondary fills, hover wash
      text: '#33291E', // Walnut — warm brown-black ink
      muted: '#6E604F', // Deep taupe — AA-safe meta, captions, and placeholders
      border: '#DDD1BE', // Sand-line — hairlines, dividers
      borderStrong: '#C9B99F', // emphasised divider / input focus base
      sale: '#9C3B2E', // Rust — markdown / sale price
      success: '#5B7247', // Leaf — in-stock, confirmed
      danger: '#C0392B',
      warning: '#C08A2E', // Amber — low-stock, caution
      info: '#4E6B7A', // Slate-blue — neutral info
      scrim: 'rgba(51,41,30,.5)', // warm brown overlay (never black)
      scrimSoft: 'rgba(51,41,30,.28)',
    },
    dark: {
      primary: '#D07A5B', // lifted terracotta for contrast on cocoa
      onPrimary: '#221B14',
      accent: '#9DAA7C', // lifted sage
      accentInk: '#AEBB8D',
      bg: '#221B14', // Cocoa — warm near-black brown
      surface: '#2B231A',
      surface2: '#362C21',
      text: '#F1E9DB', // warm cream
      muted: '#B3A48D',
      border: '#3D3225',
      borderStrong: '#4E4131',
      sale: '#E08E7A', // softer rust (legible on dark)
      success: '#8FB07A',
      danger: '#E08A80',
      warning: '#E0B15E',
      info: '#85A5B5',
      scrim: 'rgba(0,0,0,.6)',
      scrimSoft: 'rgba(0,0,0,.4)',
    },
  },
  typography: {
    fontSans: "'General Sans','Hanken Grotesk','Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
    fontSerif: "'Fraunces','Recoleta','Cooper BT',Georgia,serif",
    fontMono: "'IBM Plex Mono',ui-monospace,monospace",
    fontArabic: "'IBM Plex Sans Arabic','Noto Naskh Arabic',system-ui,sans-serif",
    fontSize: {
      '4xl': 'clamp(44px, 6.5vw, 80px)',
      '3xl': 'clamp(34px, 4.5vw, 56px)',
      '2xl': 'clamp(26px, 3.2vw, 38px)',
      xl: 'clamp(21px, 2.2vw, 27px)',
      lg: '19px',
      md: '17px',
      base: '16px',
      sm: '14px',
      xs: '12px',
    },
    lineHeight: '1.6',
    lineHeightTight: '1.12',
    // Hearth marks sections with a small serif label + rule — not a wide luxury eyebrow (T01) or a
    // mono kicker (T02). The tracking tokens stay gentle.
    trackingEyebrow: '.02em',
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
      sp11: '96px',
      sp12: '128px',
    },
    sectionY: 'clamp(56px, 8vw, 128px)',
    gutter: 'clamp(20px, 5vw, 64px)',
    gridGap: 'clamp(16px, 2vw, 32px)',
    stack: '20px',
    container: '1360px',
    containerNarrow: '740px',
    tap: '44px',
  },
  radius: {
    sm: '10px',
    base: '16px',
    lg: '24px',
    pill: '999px',
  },
  shadow: {
    // Warm, soft, diffuse — like daylight, never a spotlight. No neon glow (that is Theme 02).
    sm: '0 2px 8px rgba(51,41,30,.06)',
    base: '0 12px 32px rgba(51,41,30,.10)',
    lg: '0 28px 64px rgba(51,41,30,.16)',
    focus: '0 0 0 3px rgba(181,87,58,.35)', // terracotta focus ring
    inset: 'inset 0 -1px 0 var(--border)',
  },
  motion: {
    ease: 'cubic-bezier(.22, .61, .36, 1)', // gentle settle (default)
    easeInOut: 'cubic-bezier(.45, .05, .35, 1)',
    easeEmphasis: 'cubic-bezier(.34, 1.2, .64, 1)', // soft cushion overshoot (sparingly)
    transition: '240ms',
    transitionSlow: '400ms',
    transitionFast: '160ms',
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
