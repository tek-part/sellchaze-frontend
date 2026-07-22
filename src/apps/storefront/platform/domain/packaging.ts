/**
 * Theme packaging — a portable, self-describing package format for exporting and importing a theme's
 * configuration (identity + settings + scheme/direction). Structural + pure: packaging serialises an
 * install record; parsing validates the envelope shape. Settings are RESOLVED against the target
 * theme's schema by the installer at import time (needs the loaded module) — packaging stays UI/engine
 * free so it can run anywhere (export a file, ship a config).
 */
import type { ColorSchemePreference, Direction, ThemeSettingValue } from '../../theme-engine';
import type { ThemeInstallRecord } from './install-state';

export const PACKAGE_FORMAT = 'sellchase-theme-package' as const;
export const PACKAGE_FORMAT_VERSION = 1 as const;

export interface ThemePackage {
  readonly format: typeof PACKAGE_FORMAT;
  readonly formatVersion: typeof PACKAGE_FORMAT_VERSION;
  readonly theme: { readonly id: string; readonly version: string };
  readonly settings: Readonly<Record<string, ThemeSettingValue>>;
  readonly colorScheme?: ColorSchemePreference;
  readonly direction?: Direction;
  readonly exportedAt: string;
  readonly meta?: { readonly name?: string; readonly author?: string };
}

export interface PackageThemeInput {
  readonly id: string;
  readonly version: string;
  readonly settings: Readonly<Record<string, ThemeSettingValue>>;
  readonly colorScheme?: ColorSchemePreference;
  readonly direction?: Direction;
  readonly name?: string;
  readonly author?: string;
}

/** Build a package from raw fields. */
export function packageTheme(input: PackageThemeInput, exportedAt: string): ThemePackage {
  const meta = input.name || input.author
    ? { ...(input.name ? { name: input.name } : {}), ...(input.author ? { author: input.author } : {}) }
    : undefined;
  return {
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_FORMAT_VERSION,
    theme: { id: input.id, version: input.version },
    settings: input.settings,
    ...(input.colorScheme ? { colorScheme: input.colorScheme } : {}),
    ...(input.direction ? { direction: input.direction } : {}),
    exportedAt,
    ...(meta ? { meta } : {}),
  };
}

/** Build a package from an install record. */
export function packageFromRecord(
  record: ThemeInstallRecord,
  exportedAt: string,
  meta?: { name?: string; author?: string },
): ThemePackage {
  return packageTheme(
    {
      id: record.id,
      version: record.version,
      settings: record.settings,
      ...(record.colorScheme ? { colorScheme: record.colorScheme } : {}),
      ...(record.direction ? { direction: record.direction } : {}),
      ...(meta?.name ? { name: meta.name } : {}),
      ...(meta?.author ? { author: meta.author } : {}),
    },
    exportedAt,
  );
}

/** Pretty-print a package to JSON. */
export function serializePackage(pkg: ThemePackage): string {
  return JSON.stringify(pkg, null, 2);
}

/** Suggested download file name for a package. */
export function packageFileName(pkg: ThemePackage): string {
  return `${pkg.theme.id}-${pkg.theme.version}.theme.json`;
}

export type ParseResult =
  | { readonly ok: true; readonly package: ThemePackage }
  | { readonly ok: false; readonly error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isSettingValue(v: unknown): v is ThemeSettingValue {
  return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
}

/** Parse + structurally validate a package from a JSON string (never throws). */
export function parsePackage(json: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'not valid JSON' };
  }
  if (!isPlainObject(raw)) return { ok: false, error: 'package must be an object' };
  if (raw['format'] !== PACKAGE_FORMAT) return { ok: false, error: 'unrecognised package format' };
  if (raw['formatVersion'] !== PACKAGE_FORMAT_VERSION) {
    return { ok: false, error: `unsupported package version "${String(raw['formatVersion'])}"` };
  }
  const theme = raw['theme'];
  if (!isPlainObject(theme) || typeof theme['id'] !== 'string' || typeof theme['version'] !== 'string') {
    return { ok: false, error: 'package.theme must have string id + version' };
  }
  const settingsRaw = raw['settings'];
  if (!isPlainObject(settingsRaw)) return { ok: false, error: 'package.settings must be an object' };
  const settings: Record<string, ThemeSettingValue> = {};
  for (const [key, value] of Object.entries(settingsRaw)) {
    if (isSettingValue(value)) settings[key] = value;
  }
  const exportedAt = typeof raw['exportedAt'] === 'string' ? raw['exportedAt'] : '';
  const scheme = raw['colorScheme'];
  const dir = raw['direction'];
  const metaRaw = raw['meta'];
  const meta = isPlainObject(metaRaw)
    ? {
        ...(typeof metaRaw['name'] === 'string' ? { name: metaRaw['name'] } : {}),
        ...(typeof metaRaw['author'] === 'string' ? { author: metaRaw['author'] } : {}),
      }
    : undefined;

  const pkg: ThemePackage = {
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_FORMAT_VERSION,
    theme: { id: theme['id'], version: theme['version'] },
    settings,
    ...(scheme === 'light' || scheme === 'dark' || scheme === 'auto' ? { colorScheme: scheme } : {}),
    ...(dir === 'ltr' || dir === 'rtl' ? { direction: dir } : {}),
    exportedAt,
    ...(meta && (meta.name || meta.author) ? { meta } : {}),
  };
  return { ok: true, package: pkg };
}
