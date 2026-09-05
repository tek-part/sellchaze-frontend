/**
 * Section schema contract (docs/THEME_SECTIONS_CONTRACT.md §1) + authoring helpers.
 *
 * The types are the engine's own (`theme-engine/types.ts`) re-exported under the contract names so
 * a section schema, a theme setting schema and the backend `sections_schema` JSON are one shape.
 * The only tightening versus the contract's TS sketch: every field carries a `default` (the engine
 * needs one to fail-safe), and `list` items cannot nest lists.
 */
import type {
  ThemeListField,
  ThemeListItemField,
  ThemeLocalizedText,
  ThemeSectionCategory,
  ThemeSectionSchema,
  ThemeSettingField,
  ThemeSettings,
  ThemeSettingsSchema,
  ThemeSettingType,
} from '../theme-engine/types';
import { defaultSettings, resolveSettings } from '../theme-engine/settings';

export type SettingFieldType = ThemeSettingType;
export type SettingField = ThemeSettingField;
export type ListField = ThemeListField;
export type ListItemField = ThemeListItemField;
export type LocalizedText = ThemeLocalizedText;
export type SectionCategory = ThemeSectionCategory;
export type SectionSchema = ThemeSectionSchema;
export type SectionSettingsSchema = ThemeSettingsSchema;

/** Bilingual default copy for a translatable field: `tr('نص', 'Text')`. */
export function tr(ar: string, en: string): LocalizedText {
  return { ar, en };
}

const TYPE_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Author a section schema. Validates the type key + unique field ids in development and returns
 * the schema unchanged (frozen), so `SECTION_LIBRARY` entries are plain data the export can read.
 */
export function defineSection(schema: SectionSchema): SectionSchema {
  if (import.meta.env.DEV) {
    if (!TYPE_RE.test(schema.type)) throw new Error(`defineSection: "${schema.type}" must be kebab-case`);
    const seen = new Set<string>();
    for (const field of schema.settings) {
      if (seen.has(field.id)) throw new Error(`defineSection(${schema.type}): duplicate field "${field.id}"`);
      seen.add(field.id);
      if (field.type === 'list') {
        const inner = new Set<string>();
        for (const f of field.item) {
          if (inner.has(f.id)) throw new Error(`defineSection(${schema.type}): duplicate item field "${f.id}" in "${field.id}"`);
          inner.add(f.id);
        }
      }
    }
  }
  return Object.freeze(schema);
}

/** Resolve raw instance settings against a section schema (defaults filled, unknown keys dropped). */
export function resolveSectionSettings(
  schema: SectionSchema,
  raw: Readonly<Record<string, unknown>> | undefined,
  locale?: string,
): ThemeSettings {
  return resolveSettings(schema.settings, raw, locale);
}

/** Fully-defaulted settings of a section schema (translatable defaults picked for `locale`). */
export function sectionDefaults(schema: SectionSchema, locale?: string): ThemeSettings {
  return defaultSettings(schema.settings, locale);
}

/* ------------------------------------------------------------ shared field factories */

/** Reusable field builders so every section's editor reads the same way. */
export const fields = {
  text(id: string, label: string, def: string | LocalizedText = '', extra: Partial<Omit<ThemeListItemField, 'id' | 'type' | 'label' | 'default'>> = {}): ListItemField {
    return { id, type: 'text', label, default: def, translatable: true, ...extra } as ListItemField;
  },
  textarea(id: string, label: string, def: string | LocalizedText = '', extra: Partial<Omit<ThemeListItemField, 'id' | 'type' | 'label' | 'default'>> = {}): ListItemField {
    return { id, type: 'textarea', label, default: def, translatable: true, ...extra } as ListItemField;
  },
  richtext(id: string, label: string, def: string | LocalizedText = ''): ListItemField {
    return { id, type: 'richtext', label, default: def, translatable: true };
  },
  image(id: string, label: string, def = '', hint?: string): ListItemField {
    return { id, type: 'image', label, default: def, ...(hint ? { hint } : {}) };
  },
  url(id: string, label: string, def = ''): ListItemField {
    return { id, type: 'url', label, default: def };
  },
  color(id: string, label: string, def = ''): ListItemField {
    return { id, type: 'color', label, default: def, hint: 'Leave empty to use the theme colour.' };
  },
  toggle(id: string, label: string, def = true, hint?: string): ListItemField {
    return { id, type: 'toggle', label, default: def, ...(hint ? { hint } : {}) };
  },
  range(id: string, label: string, def: number, min: number, max: number, step = 1, hint?: string): ListItemField {
    return { id, type: 'range', label, default: def, min, max, step, ...(hint ? { hint } : {}) };
  },
  number(id: string, label: string, def: number, min?: number, max?: number): ListItemField {
    return { id, type: 'number', label, default: def, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  },
  select(id: string, label: string, options: ReadonlyArray<{ value: string; label: string }>, def: string, hint?: string): ListItemField {
    return { id, type: 'select', label, options, default: def, ...(hint ? { hint } : {}) };
  },
  collection(id: string, label: string, def = 'newest', hint?: string): ListItemField {
    return { id, type: 'collection', label, default: def, hint: hint ?? 'newest · featured · bestsellers · sale · trending — or a collection id/slug.' };
  },
  category(id: string, label: string, def = ''): ListItemField {
    return { id, type: 'category', label, default: def };
  },
  product(id: string, label: string, def = ''): ListItemField {
    return { id, type: 'product', label, default: def };
  },
  list(id: string, label: string, item: ReadonlyArray<ListItemField>, def: ListField['default'], max = 12, hint?: string): ListField {
    return { id, type: 'list', label, item, default: def, max, ...(hint ? { hint } : {}) };
  },
} as const;

/** Frequently reused option sets. */
export const OPTIONS = {
  columns: (min = 2, max = 6): ReadonlyArray<{ value: string; label: string }> =>
    Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: `${min + i}` })),
  align: [
    { value: 'start', label: 'Start' },
    { value: 'center', label: 'Center' },
    { value: 'end', label: 'End' },
  ],
  layout: [
    { value: 'grid', label: 'Grid' },
    { value: 'carousel', label: 'Carousel' },
  ],
  aspect: [
    { value: 'auto', label: 'Natural' },
    { value: 'square', label: 'Square 1:1' },
    { value: 'landscape', label: 'Landscape 4:3' },
    { value: 'wide', label: 'Wide 16:9' },
    { value: 'portrait', label: 'Portrait 3:4' },
  ],
  background: [
    { value: 'none', label: 'None' },
    { value: 'surface', label: 'Surface' },
    { value: 'primary', label: 'Primary' },
    { value: 'accent', label: 'Accent' },
  ],
  height: [
    { value: 'auto', label: 'Auto' },
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'tall', label: 'Tall' },
    { value: 'full', label: 'Full screen' },
  ],
} as const;

/** The section-spacing pair every library section exposes (responsive, css_property-driven). */
export function spacingFields(defaultBlock = 64): ReadonlyArray<SettingField> {
  return [
    {
      id: 'padding_block',
      type: 'range',
      label: 'Vertical spacing',
      group: 'Spacing',
      default: defaultBlock,
      min: 0,
      max: 200,
      step: 4,
      responsive: true,
      css_property: 'padding-block',
    },
  ];
}
