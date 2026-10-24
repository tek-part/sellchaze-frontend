/**
 * Stride palette resolution (pure): merchant settings → the colour slots of both schemes.
 *
 * `color_scheme` picks the ground: "dark" puts the night palette in BOTH engine slots (so the store
 * is dark whatever the shopper's OS says), "light" puts the court palette in both, and "auto"
 * keeps court in light and night in dark so the engine follows the device. The accent preset is
 * then laid over each ground with the contrast-checked values from `ACCENTS`.
 */
import type { DesignTokens, ThemeSettings } from '../../theme-engine/types';
import { ACCENTS, COURT, NIGHT, type AccentPreset } from './tokens';

type Palette = DesignTokens['color']['light'];
type Ground = 'dark' | 'light';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Relative luminance (WCAG) of a #rgb / #rrggbb colour; 0 for anything unparsable. */
export function luminance(hex: string): number {
  if (!HEX.test(hex)) return 0;
  const h = hex.slice(1);
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white — whichever reads better on `fill`. */
export function inkOn(fill: string): string {
  return contrast(fill, '#0B0B0C') >= contrast(fill, '#FFFFFF') ? '#0B0B0C' : '#FFFFFF';
}

function preset(settings: ThemeSettings): AccentPreset | 'custom' {
  const v = settings['accent_preset'];
  return v === 'red' || v === 'custom' ? v : 'volt';
}

function customAccent(settings: ThemeSettings): string {
  const v = settings['accent_color'];
  return typeof v === 'string' && HEX.test(v) ? v : ACCENTS.volt.dark.fill;
}

/** The accent laid over one ground. */
export function accentFor(settings: ThemeSettings, ground: Ground): { primary: string; onPrimary: string; fill: string; ink: string } {
  const p = preset(settings);
  if (p !== 'custom') return ACCENTS[p][ground];
  const accent = customAccent(settings);
  const base = ground === 'dark' ? NIGHT : COURT;
  // A light accent on the light ground reads poorly as a button or as text: buttons go black and
  // text accents fall back to the ground's text colour; the accent stays a fill.
  const readable = contrast(accent, base.bg) >= 3;
  return {
    primary: readable ? accent : base.text,
    onPrimary: inkOn(readable ? accent : base.text),
    fill: accent,
    ink: contrast(accent, base.bg) >= 4.5 ? accent : base.text,
  };
}

function paint(ground: Ground, settings: ThemeSettings): Palette {
  const base = ground === 'dark' ? NIGHT : COURT;
  const a = accentFor(settings, ground);
  return { ...base, primary: a.primary, onPrimary: a.onPrimary, accent: a.fill, accentInk: a.ink };
}

/** Both engine colour slots for the merchant's scheme + accent. */
export function stridePalettes(settings: ThemeSettings): DesignTokens['color'] {
  const scheme = settings['color_scheme'];
  if (scheme === 'light') {
    const p = paint('light', settings);
    return { light: p, dark: p };
  }
  if (scheme === 'auto') return { light: paint('light', settings), dark: paint('dark', settings) };
  const p = paint('dark', settings);
  return { light: p, dark: p };
}

/** The accent fill actually on screen for the engine's resolved scheme. */
export function accentFill(settings: ThemeSettings, engineScheme: 'light' | 'dark'): string {
  const palettes = stridePalettes(settings);
  return (engineScheme === 'dark' ? palettes.dark : palettes.light).accent;
}
