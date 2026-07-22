/**
 * Typed, fail-safe readers over a section instance's `ThemeSettings`. Every getter coerces and
 * falls back, so a missing or malformed setting never throws — sections always render (engine I2).
 * Mirrors the documented field types (text/textarea/richtext/url/image → string, toggle → boolean,
 * number/range → number, select → string).
 */
import type { ThemeSettings } from '../../../theme-engine/types';

export function text(settings: ThemeSettings, key: string, fallback = ''): string {
  const value = settings[key];
  return typeof value === 'string' ? value : fallback;
}

export function flag(settings: ThemeSettings, key: string, fallback = false): boolean {
  const value = settings[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function count(settings: ThemeSettings, key: string, fallback: number): number {
  const value = settings[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Clamp a numeric setting into [min, max]. */
export function range(
  settings: ThemeSettings,
  key: string,
  fallback: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, count(settings, key, fallback)));
}

/** A select value restricted to a known set (falls back to the first allowed value). */
export function option<T extends string>(
  settings: ThemeSettings,
  key: string,
  allowed: ReadonlyArray<T>,
  fallback: T,
): T {
  const value = settings[key];
  return typeof value === 'string' && (allowed as ReadonlyArray<string>).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Parse a textarea/richtext setting that encodes a simple list — one item per line, or
 * "term | definition" for FAQ-style pairs. Blank lines are dropped. This is how list settings are
 * modelled where the page-builder has no repeater field type.
 */
export function lines(settings: ThemeSettings, key: string): string[] {
  return text(settings, key)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function pairs(settings: ThemeSettings, key: string): Array<{ term: string; definition: string }> {
  return lines(settings, key).map((line) => {
    const [term, ...rest] = line.split('|');
    return { term: (term ?? '').trim(), definition: rest.join('|').trim() };
  });
}
