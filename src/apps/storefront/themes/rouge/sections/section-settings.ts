/**
 * Rouge — typed, fail-safe readers over a section instance's ThemeSettings (untyped record). Every
 * getter coerces + falls back, so a missing/malformed setting never throws. Rouge's own copy (no
 * other theme import); mirrors the engine's documented field types.
 */
import type { ThemeSettings } from '../../../theme-engine/types';

export function text(settings: ThemeSettings, key: string, fallback = ''): string {
  const v = settings[key];
  return typeof v === 'string' ? v : fallback;
}
export function flag(settings: ThemeSettings, key: string, fallback = false): boolean {
  const v = settings[key];
  return typeof v === 'boolean' ? v : fallback;
}
export function count(settings: ThemeSettings, key: string, fallback: number): number {
  const v = settings[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
export function range(settings: ThemeSettings, key: string, fallback: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, count(settings, key, fallback)));
}
export function option<T extends string>(settings: ThemeSettings, key: string, allowed: ReadonlyArray<T>, fallback: T): T {
  const v = settings[key];
  return typeof v === 'string' && (allowed as ReadonlyArray<string>).includes(v) ? (v as T) : fallback;
}
export function lines(settings: ThemeSettings, key: string): string[] {
  return text(settings, key).split('\n').map((l) => l.trim()).filter(Boolean);
}
