/**
 * Theme settings resolution — fail-safe validation + coercion against a theme's schema.
 *
 * Mirrors the documented engine contract (docs/THEME-ENGINE-V2.md §6/§7): the result is
 * ALWAYS a fully-defaulted, valid settings map. Invalid values coerce to their default,
 * ranges clamp, selects fall back, and keys not in the schema are dropped. Never throws.
 */
import type {
  ThemeSettings,
  ThemeSettingsSchema,
  ThemeSettingValue,
} from './types';

function coerceField(
  field: ThemeSettingsSchema[number],
  raw: unknown,
): ThemeSettingValue {
  // Every field carries a `default`; captured here so the exhaustive switch's unreachable
  // branch has a value without dereferencing `never`.
  const fallback: ThemeSettingValue = field.default;
  switch (field.type) {
    case 'toggle':
      return typeof raw === 'boolean' ? raw : field.default;

    case 'number':
    case 'range': {
      const n = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(n)) return field.default;
      let value = n;
      if (field.min !== undefined) value = Math.max(field.min, value);
      if (field.max !== undefined) value = Math.min(field.max, value);
      return value;
    }

    case 'select':
      return typeof raw === 'string' && field.options.some((o) => o.value === raw)
        ? raw
        : field.default;

    case 'url':
      if (typeof raw !== 'string') return field.default;
      if (raw === '') return raw;
      try {
        void new URL(raw, 'https://example.com');
        return raw;
      } catch {
        return field.default;
      }

    case 'text':
    case 'textarea':
    case 'color':
    case 'richtext':
    case 'image':
      return typeof raw === 'string' ? raw : field.default;

    default:
      return fallback;
  }
}

/**
 * Build the fully-defaulted settings map (every field at its default).
 */
export function defaultSettings(schema: ThemeSettingsSchema): ThemeSettings {
  const out: Record<string, ThemeSettingValue> = {};
  for (const field of schema) out[field.id] = field.default;
  return Object.freeze(out);
}

/**
 * Resolve arbitrary (possibly partial / invalid) input into a valid settings map for the
 * given schema. Unknown keys are dropped; every schema field is present and valid.
 */
export function resolveSettings(
  schema: ThemeSettingsSchema,
  raw: Partial<Record<string, unknown>> | undefined,
): ThemeSettings {
  const out: Record<string, ThemeSettingValue> = {};
  for (const field of schema) {
    const provided = raw ? raw[field.id] : undefined;
    out[field.id] = provided === undefined ? field.default : coerceField(field, provided);
  }
  return Object.freeze(out);
}
