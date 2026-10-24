/**
 * Stride — base design tokens and colour presets.
 *
 * Two neutral grounds (a near-black "night" and an off-white "court") crossed with two sharp
 * accents (volt and red). `createTokens` picks one ground + one accent from the merchant's
 * settings; the neutral values below never change. Rubik carries the display type (it ships Arabic
 * glyphs too), Inter the body copy, IBM Plex Sans Arabic the Arabic body fallback.
 */
import type { DesignTokens } from '../../theme-engine/types';

export const ARABIC_STACK = "'IBM Plex Sans Arabic','Rubik','Noto Sans Arabic',system-ui,sans-serif";

type Palette = DesignTokens['color']['light'];

/** Neutral ground for the dark scheme ("night"). */
export const NIGHT: Palette = {
  primary: '#D4FF1E',
  onPrimary: '#0B0B0C',
  accent: '#D4FF1E',
  accentInk: '#D4FF1E',
  bg: '#0B0B0C',
  surface: '#141416',
  surface2: '#1D1E21',
  text: '#F4F4EF',
  muted: '#A6A7A2',
  border: '#2A2B2F',
  borderStrong: '#45464C',
  sale: '#FF5A5F',
  success: '#4ADE80',
  danger: '#FF5A5F',
  warning: '#FBBF24',
  info: '#60A5FA',
  scrim: 'rgba(0,0,0,.72)',
  scrimSoft: 'rgba(0,0,0,.45)',
};

/** Neutral ground for the light scheme ("court"). */
export const COURT: Palette = {
  primary: '#0B0B0C',
  onPrimary: '#FFFFFF',
  accent: '#D4FF1E',
  accentInk: '#4A6400',
  bg: '#F3F3EF',
  surface: '#FFFFFF',
  surface2: '#E8E8E2',
  text: '#0B0B0C',
  muted: '#55565B',
  border: '#DADAD3',
  borderStrong: '#B4B4AC',
  sale: '#C8000F',
  success: '#15803D',
  danger: '#C8000F',
  warning: '#B45309',
  info: '#1D4ED8',
  scrim: 'rgba(11,11,12,.6)',
  scrimSoft: 'rgba(11,11,12,.32)',
};

export type AccentPreset = 'volt' | 'red';

/**
 * Accent slots per preset and ground. `fill` is the accent as a surface colour (badges, bars,
 * highlights); `ink` is the accent as text on the ground (AA on that ground); `primary`/`onPrimary`
 * drive buttons.
 */
export const ACCENTS: Record<AccentPreset, Record<'dark' | 'light', { primary: string; onPrimary: string; fill: string; ink: string }>> = {
  volt: {
    dark: { primary: '#D4FF1E', onPrimary: '#0B0B0C', fill: '#D4FF1E', ink: '#D4FF1E' },
    light: { primary: '#0B0B0C', onPrimary: '#FFFFFF', fill: '#D4FF1E', ink: '#4A6400' },
  },
  red: {
    dark: { primary: '#E0141B', onPrimary: '#FFFFFF', fill: '#E0141B', ink: '#FF6266' },
    light: { primary: '#D0101A', onPrimary: '#FFFFFF', fill: '#D0101A', ink: '#B80D16' },
  },
};

export const strideBaseTokens = {
  color: { light: COURT, dark: NIGHT },
  typography: {
    fontSans: `'Inter',${ARABIC_STACK}`,
    fontSerif: `'Rubik','Inter',${ARABIC_STACK}`,
    fontMono: "'IBM Plex Mono',ui-monospace,SFMono-Regular,monospace",
    fontArabic: ARABIC_STACK,
    fontSize: {
      '4xl': 'clamp(44px, 8vw, 112px)',
      '3xl': 'clamp(34px, 5.5vw, 68px)',
      '2xl': 'clamp(28px, 4vw, 46px)',
      xl: 'clamp(20px, 2.2vw, 26px)',
      lg: '19px',
      md: '17px',
      base: '15px',
      sm: '13px',
      xs: '12px',
    },
    lineHeight: '1.55',
    lineHeightTight: '0.98',
    trackingEyebrow: '.16em',
    trackingCaps: '.08em',
  },
  spacing: {
    scale: {
      sp0: '0', sp1: '4px', sp2: '8px', sp3: '12px', sp4: '16px', sp5: '20px', sp6: '24px',
      sp7: '32px', sp8: '40px', sp9: '48px', sp10: '64px', sp11: '80px', sp12: '104px',
    },
    sectionY: 'clamp(44px, 7vw, 96px)',
    gutter: 'clamp(16px, 3.5vw, 40px)',
    gridGap: 'clamp(8px, 1.4vw, 16px)',
    stack: '20px',
    container: '1440px',
    containerNarrow: '860px',
    tap: '44px',
  },
  radius: { sm: '0px', base: '0px', lg: '0px', pill: '999px' },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,.12)',
    base: '0 6px 20px rgba(0,0,0,.16)',
    lg: '0 24px 60px rgba(0,0,0,.32)',
    focus: '0 0 0 3px rgba(212,255,30,.55)',
    inset: 'inset 0 -1px 0 var(--border)',
  },
  motion: {
    ease: 'cubic-bezier(.2, .8, .2, 1)',
    easeInOut: 'cubic-bezier(.65, 0, .35, 1)',
    easeEmphasis: 'cubic-bezier(.16, 1, .3, 1)',
    transition: '180ms',
    transitionSlow: '420ms',
    transitionFast: '120ms',
  },
  size: { iconSm: '18px', iconMd: '22px', iconLg: '28px' },
  zIndex: { base: 0, sticky: 100, header: 200, dropdown: 300, overlay: 400, drawer: 500, modal: 600, toast: 700 },
  breakpoints: { sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
} satisfies DesignTokens;
