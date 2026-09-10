/**
 * Section-side settings resolution. Every library component calls `useSectionSettings(SCHEMA, raw)`
 * once and reads typed values through the `read` helpers — so an empty `settings` object (a freshly
 * added section in the customizer) renders the schema defaults, translatable text is picked for the
 * active language, and a malformed value can never throw.
 */
import { useMemo, type CSSProperties } from 'react';
import type { ThemeSettingListItem, ThemeSettings } from '../theme-engine/types';
import { useLocaleCode } from './i18n';
import { resolveBlocks, resolveSectionSettings, variantOf, type RawBlock, type ResolvedBlock, type SectionSchema } from './schema';

export function useSectionSettings(schema: SectionSchema, raw: Readonly<Record<string, unknown>> | undefined): ThemeSettings {
  const locale = useLocaleCode();
  return useMemo(() => resolveSectionSettings(schema, raw, locale), [schema, raw, locale]);
}

/**
 * The section's visible blocks (contract §7): `settings.blocks` → legacy list → `fallback` demo
 * blocks, resolved for the active language. Pass the resolved settings from `useSectionSettings`
 * (they carry `blocks` through) or the raw instance settings — both work.
 */
export function useSectionBlocks(
  schema: SectionSchema,
  settings: Readonly<Record<string, unknown>> | undefined,
  legacyListField?: string,
  fallback?: ReadonlyArray<RawBlock>,
): ReadonlyArray<ResolvedBlock> {
  const locale = useLocaleCode();
  return useMemo(() => resolveBlocks(schema, settings, legacyListField, { locale, fallback }), [schema, settings, legacyListField, fallback, locale]);
}

/** The active variant value of a section (`''` when the schema declares none). */
export function useVariant(schema: SectionSchema, settings: Readonly<Record<string, unknown>> | undefined): string {
  return variantOf(schema, settings);
}

/* ------------------------------------------------------------------ typed readers */

export function str(s: ThemeSettings | ThemeSettingListItem, key: string, fallback = ''): string {
  const v = s[key];
  return typeof v === 'string' ? v : fallback;
}

export function bool(s: ThemeSettings | ThemeSettingListItem, key: string, fallback = false): boolean {
  const v = s[key];
  return typeof v === 'boolean' ? v : fallback;
}

export function num(s: ThemeSettings | ThemeSettingListItem, key: string, fallback: number): number {
  const v = s[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

export function list(s: ThemeSettings, key: string): ReadonlyArray<ThemeSettingListItem> {
  const v = s[key];
  return Array.isArray(v) ? (v as ReadonlyArray<ThemeSettingListItem>) : [];
}

/** Inline style for the responsive grid: `--lib-cols` (desktop) with tablet/mobile fallbacks. */
export function gridStyle(columns: number, mobile = columns >= 4 ? 2 : 1): CSSProperties {
  return {
    '--lib-cols': columns,
    '--lib-cols-lg': Math.min(columns, 3),
    '--lib-cols-md': Math.min(columns, 2),
    '--lib-cols-sm': mobile,
  } as CSSProperties;
}

/** Inline style for the section frame from the spacing fields (`padding_block`). */
export function spacingStyle(s: ThemeSettings): CSSProperties | undefined {
  const pb = s['padding_block'];
  if (typeof pb !== 'number') return undefined;
  return { '--lib-pb': `${pb}px` } as CSSProperties;
}

/** Map a `background` select to the library band class. */
export function bandClass(value: string): string {
  switch (value) {
    case 'surface':
      return 'lib-band lib-band--surface';
    case 'primary':
      return 'lib-band lib-band--primary';
    case 'accent':
      return 'lib-band lib-band--accent';
    default:
      return '';
  }
}

/** Map an `aspect` select to the library ratio class. */
export function aspectClass(value: string): string {
  return value && value !== 'auto' ? `lib-ratio lib-ratio--${value}` : '';
}
