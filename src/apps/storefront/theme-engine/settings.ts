/**
 * Theme settings resolution — fail-safe validation + coercion against a theme's schema.
 *
 * Mirrors the documented engine contract (docs/THEME-ENGINE-V2.md §6/§7): the result is
 * ALWAYS a fully-defaulted, valid settings map. Invalid values coerce to their default,
 * ranges clamp, selects fall back, and keys not in the schema are dropped. Never throws.
 *
 * Contract additions (docs/THEME_SECTIONS_CONTRACT.md §1):
 *  • `list` fields pass arrays through — every item is validated against `item`, unknown keys are
 *    dropped, missing item fields are filled with their defaults, and `max` caps the length.
 *  • translatable text may arrive as a `{ ar, en }` locale map; `locale` picks the language.
 *  • `product` / `category` / `collection` hold a string id (any string is accepted, trimmed).
 */
import type {
  ThemeListField,
  ThemeListItemField,
  ThemeSettingDefaultScalar,
  ThemeSettingListItem,
  ThemeSettings,
  ThemeSettingScalar,
  ThemeSettingsSchema,
  ThemeSettingValue,
} from './types';

/**
 * A translatable text setting may arrive as `{ ar: '…', en: '…' }` (the merchant editor stores one
 * value per language; the API normally flattens it per request, but a preview `?settings=` blob or
 * an older resolver can still hand the object through). Pick `locale` → first non-empty → ''.
 * Returns undefined when the value is not a locale map at all so the caller falls back to default.
 */
function pickLocalizedText(raw: Record<string, unknown>, locale?: string): string | undefined {
  const values = Object.values(raw);
  if (values.length === 0 || !values.every((v) => v == null || typeof v === 'string')) return undefined;
  const direct = locale ? raw[locale] : undefined;
  if (typeof direct === 'string' && direct.trim() !== '') return direct;
  for (const v of values) if (typeof v === 'string' && v.trim() !== '') return v;
  return '';
}

/** A field's default as a scalar — a translatable map default is picked for `locale`. */
function scalarDefault(value: ThemeSettingDefaultScalar, locale?: string): ThemeSettingScalar {
  if (value !== null && typeof value === 'object') return pickLocalizedText(value, locale) ?? '';
  return value;
}

function coerceScalar(field: ThemeListItemField, raw: unknown, locale?: string): ThemeSettingScalar {
  const fallback = scalarDefault(field.default, locale);
  // Defensive: a localized object for a string-typed field resolves to one language's text.
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const picked = pickLocalizedText(raw as Record<string, unknown>, locale);
    if (picked === undefined) return fallback;
    raw = picked;
  }
  switch (field.type) {
    case 'toggle':
      if (typeof raw === 'boolean') return raw;
      // Form posts and older editors serialise toggles as strings/numbers.
      if (raw === 'true' || raw === 1 || raw === '1') return true;
      if (raw === 'false' || raw === 0 || raw === '0') return false;
      return fallback;

    case 'number':
    case 'range': {
      const n = typeof raw === 'number' ? raw : raw === '' ? NaN : Number(raw);
      if (!Number.isFinite(n)) return fallback;
      let value = n;
      if (field.min !== undefined) value = Math.max(field.min, value);
      if (field.max !== undefined) value = Math.min(field.max, value);
      return value;
    }

    case 'select':
      return typeof raw === 'string' && field.options.some((o) => o.value === raw)
        ? raw
        : fallback;

    case 'url':
      if (typeof raw !== 'string') return fallback;
      if (raw === '') return raw;
      try {
        void new URL(raw, 'https://example.com');
        return raw;
      } catch {
        return fallback;
      }

    case 'product':
    case 'category':
    case 'collection':
      if (typeof raw === 'string') return raw.trim();
      if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
      return fallback;

    case 'text':
    case 'textarea':
    case 'color':
    case 'richtext':
    case 'image':
      return typeof raw === 'string' ? raw : fallback;

    default:
      return fallback;
  }
}

/** Fully-defaulted item for a list field. */
function defaultItem(field: ThemeListField, locale?: string): Record<string, ThemeSettingScalar> {
  const out: Record<string, ThemeSettingScalar> = {};
  for (const f of field.item) out[f.id] = scalarDefault(f.default, locale);
  return out;
}

function coerceList(field: ThemeListField, raw: unknown, locale?: string): ReadonlyArray<ThemeSettingListItem> {
  // The schema default is itself raw (it may carry locale maps): resolve it through the same path.
  if (!Array.isArray(raw)) return raw === field.default ? [] : coerceList(field, field.default, locale);
  const items: ThemeSettingListItem[] = [];
  const limit = field.max !== undefined && field.max > 0 ? field.max : Infinity;
  for (const entry of raw) {
    if (items.length >= limit) break;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const source = entry as Record<string, unknown>;
    const item = defaultItem(field, locale);
    for (const f of field.item) {
      const provided = source[f.id];
      if (provided !== undefined) item[f.id] = coerceScalar(f, provided, locale);
    }
    items.push(Object.freeze(item));
  }
  return items;
}

function coerceField(
  field: ThemeSettingsSchema[number],
  raw: unknown,
  locale?: string,
): ThemeSettingValue {
  if (field.type === 'list') return coerceList(field, raw, locale);
  return coerceScalar(field, raw, locale);
}

/**
 * Build the fully-defaulted settings map (every field at its default, translatable defaults picked
 * for `locale`).
 */
export function defaultSettings(schema: ThemeSettingsSchema, locale?: string): ThemeSettings {
  const out: Record<string, ThemeSettingValue> = {};
  for (const field of schema) out[field.id] = coerceField(field, field.default, locale);
  return Object.freeze(out);
}

/**
 * Resolve arbitrary (possibly partial / invalid) input into a valid settings map for the
 * given schema. Unknown keys are dropped; every schema field is present and valid.
 * `locale` (optional) selects the language when a text setting is a `{ locale: string }` map.
 */
export function resolveSettings(
  schema: ThemeSettingsSchema,
  raw: Partial<Record<string, unknown>> | undefined,
  locale?: string,
): ThemeSettings {
  const out: Record<string, ThemeSettingValue> = {};
  for (const field of schema) {
    const provided = raw ? raw[field.id] : undefined;
    out[field.id] = coerceField(field, provided === undefined ? field.default : provided, locale);
  }
  return Object.freeze(out);
}

/**
 * Flatten a settings draft's translatable locale maps to plain strings for `locale` (nested list
 * items included) WITHOUT validating against a schema. Used by the live customizer, which receives
 * `{ ar, en }` maps from the editor but must hand the theme provider plain scalars.
 */
export function flattenLocalizedSettings(
  raw: Readonly<Record<string, unknown>>,
  locale: string,
): Record<string, ThemeSettingValue> {
  const out: Record<string, ThemeSettingValue> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value
        .filter((v): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v))
        .map((item) => {
          const flat: Record<string, ThemeSettingScalar> = {};
          for (const [k, v] of Object.entries(item)) {
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') flat[k] = v;
            else if (v !== null && typeof v === 'object') {
              const picked = pickLocalizedText(v as Record<string, unknown>, locale);
              if (picked !== undefined) flat[k] = picked;
            }
          }
          return Object.freeze(flat);
        });
    } else if (value !== null && typeof value === 'object') {
      const picked = pickLocalizedText(value as Record<string, unknown>, locale);
      if (picked !== undefined) out[key] = picked;
    }
  }
  return out;
}
