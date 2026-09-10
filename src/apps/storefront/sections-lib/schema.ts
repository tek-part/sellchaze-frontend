/**
 * Section schema contract (docs/THEME_SECTIONS_CONTRACT.md §1) + authoring helpers.
 *
 * The types are the engine's own (`theme-engine/types.ts`) re-exported under the contract names so
 * a section schema, a theme setting schema and the backend `sections_schema` JSON are one shape.
 * The only tightening versus the contract's TS sketch: every field carries a `default` (the engine
 * needs one to fail-safe), and `list` items cannot nest lists.
 */
import type {
  ThemeBlockSchema,
  ThemeListField,
  ThemeListItemField,
  ThemeLocalizedText,
  ThemeSectionBlocks,
  ThemeSectionCategory,
  ThemeSectionSchema,
  ThemeSectionVariants,
  ThemeSettingBlock,
  ThemeSettingField,
  ThemeSettingListItem,
  ThemeSettings,
  ThemeSettingsSchema,
  ThemeSettingType,
  ThemeVariantOption,
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
export type BlockSchema = ThemeBlockSchema;
export type SectionBlocks = ThemeSectionBlocks;
export type SectionVariants = ThemeSectionVariants;
export type VariantOption = ThemeVariantOption;
export type RawBlock = ThemeSettingBlock;

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
    if (schema.variants) {
      const field = schema.settings.find((f) => f.id === schema.variants!.field);
      if (!field || field.type !== 'select') throw new Error(`defineSection(${schema.type}): variants.field "${schema.variants.field}" must be a select setting`);
      for (const o of schema.variants.options) {
        if (!field.options.some((x) => x.value === o.value)) throw new Error(`defineSection(${schema.type}): variant "${o.value}" is not an option of "${field.id}"`);
      }
    }
    if (schema.blocks) {
      const types = new Set<string>();
      for (const b of schema.blocks.types) {
        if (types.has(b.type)) throw new Error(`defineSection(${schema.type}): duplicate block type "${b.type}"`);
        types.add(b.type);
      }
      if (schema.blocks.legacy && !schema.settings.some((f) => f.id === schema.blocks!.legacy && f.type === 'list')) {
        throw new Error(`defineSection(${schema.type}): blocks.legacy "${schema.blocks.legacy}" must be a list setting`);
      }
    }
  }
  return Object.freeze(schema);
}

/* ------------------------------------------------------------ variants (§7) */

/**
 * Author the display styles of a section; pair with `variantSelect()` in `settings`. `legacy` maps
 * pre-§7 keys/values (`{ style: { plain: 'icons-row' } }`) so stored data keeps rendering.
 */
export function variants(field: string, options: ReadonlyArray<VariantOption>, legacy?: Readonly<Record<string, Readonly<Record<string, string>>>>): SectionVariants {
  return Object.freeze({
    field,
    options: Object.freeze(options.map((o) => Object.freeze({ ...o }))),
    ...(legacy ? { legacy: Object.entries(legacy).map(([f, map]) => Object.freeze({ field: f, map })) } : {}),
  });
}

/** The select setting that stores the chosen variant (the editor renders the picker instead). */
export function variantSelect(v: SectionVariants, def: string, label = 'Layout'): ListItemField {
  return { id: v.field, type: 'select', label, options: v.options.map((o) => ({ value: o.value, label: o.label })), default: def };
}

/** The active variant of a section: `settings[field]` when valid, else the select default, else the first option. */
export function variantOf(schema: SectionSchema, settings: Readonly<Record<string, unknown>> | undefined): string {
  const v = schema.variants;
  if (!v || v.options.length === 0) return '';
  const valid = (x: unknown): x is string => typeof x === 'string' && v.options.some((o) => o.value === x);
  const raw = settings?.[v.field];
  if (valid(raw)) return raw;
  for (const l of v.legacy ?? []) {
    const stored = settings?.[l.field];
    if (stored === undefined || stored === null) continue;
    const mapped = l.map[String(stored)];
    if (valid(mapped)) return mapped;
  }
  const field = schema.settings.find((f) => f.id === v.field);
  if (field && field.type === 'select' && v.options.some((o) => o.value === field.default)) return field.default;
  return v.options[0]!.value;
}

/* ------------------------------------------------------------ blocks (§7) */

/** A validated block instance ready to render (settings resolved against the block schema). */
export interface ResolvedBlock {
  readonly id: string;
  readonly type: string;
  readonly hidden: boolean;
  readonly settings: ThemeSettingListItem;
}

/** Author a block schema (unique field ids checked in development). */
export function defineBlock(schema: BlockSchema): BlockSchema {
  if (import.meta.env.DEV) {
    if (!TYPE_RE.test(schema.type)) throw new Error(`defineBlock: "${schema.type}" must be kebab-case`);
    const seen = new Set<string>();
    for (const f of schema.settings) {
      if (seen.has(f.id)) throw new Error(`defineBlock(${schema.type}): duplicate field "${f.id}"`);
      seen.add(f.id);
    }
  }
  return Object.freeze(schema);
}

/** The block types a section accepts (empty when the section has no blocks). */
export function blocksOf(schema: SectionSchema): ReadonlyArray<BlockSchema> {
  return schema.blocks?.types ?? EMPTY_BLOCKS;
}
const EMPTY_BLOCKS: ReadonlyArray<BlockSchema> = Object.freeze([]);

export function blockSchemaFor(schema: SectionSchema, type: string): BlockSchema | undefined {
  return blocksOf(schema).find((b) => b.type === type);
}

/** A fresh id for a block created in the editor (`b_` + 8 base-36 chars). */
export function newBlockId(): string {
  const rand = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `b_${rand}`;
}

/** A fully-defaulted block of `type` for a section (undefined for an unknown type). */
export function defaultBlock(schema: SectionSchema, type: string, locale?: string): ResolvedBlock | undefined {
  const block = blockSchemaFor(schema, type);
  if (!block) return undefined;
  return Object.freeze({ id: newBlockId(), type, hidden: false, settings: defaultSettings(block.settings, locale) as ThemeSettingListItem });
}

export interface ResolveBlocksOptions {
  readonly locale?: string;
  /** Keep hidden blocks in the result (the renderer normally drops them). */
  readonly includeHidden?: boolean;
  /** Raw blocks rendered when the section has no blocks AND no legacy list (demo/preview content). */
  readonly fallback?: ReadonlyArray<RawBlock>;
}

/**
 * Typed blocks of a section: `settings.blocks` first (unknown types dropped, hidden blocks removed,
 * `max`/`limit` applied, each block's settings resolved against its schema); when that is absent or
 * empty and `legacyListField` (or `schema.blocks.legacy`) names a list, its items become blocks of
 * the first block type so data stored before §7 keeps rendering. Accepts raw OR resolved settings.
 */
export function resolveBlocks(
  schema: SectionSchema,
  settings: Readonly<Record<string, unknown>> | undefined,
  legacyListField?: string,
  options: ResolveBlocksOptions = {},
): ReadonlyArray<ResolvedBlock> {
  const types = blocksOf(schema);
  if (types.length === 0) return EMPTY_RESOLVED;
  const { locale, includeHidden = false } = options;
  const raw = settings?.['blocks'];
  let source: ReadonlyArray<unknown> | undefined = Array.isArray(raw) && raw.length > 0 ? raw : undefined;

  if (!source) {
    const legacy = legacyListField ?? schema.blocks?.legacy;
    if (legacy) {
      const stored = settings?.[legacy];
      const field = schema.settings.find((f) => f.id === legacy);
      const items = Array.isArray(stored) ? stored : field && field.type === 'list' ? field.default : [];
      if (items.length > 0) source = items.map((item, i) => ({ id: `${legacy}-${i + 1}`, type: types[0]!.type, settings: item }));
    }
  }
  if (!source && options.fallback && options.fallback.length > 0) source = options.fallback;
  if (!source) return EMPTY_RESOLVED;

  const out: ResolvedBlock[] = [];
  const perType = new Map<string, number>();
  const max = schema.blocks?.max && schema.blocks.max > 0 ? schema.blocks.max : Infinity;
  for (const [i, entry] of source.entries()) {
    if (out.length >= max) break;
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const b = entry as Record<string, unknown>;
    const type = typeof b['type'] === 'string' ? b['type'] : '';
    const block = types.find((t) => t.type === type);
    if (!block) continue;
    const hidden = b['hidden'] === true;
    if (hidden && !includeHidden) continue;
    const count = perType.get(type) ?? 0;
    if (block.limit !== undefined && block.limit > 0 && count >= block.limit) continue;
    perType.set(type, count + 1);
    const provided = b['settings'];
    const id = typeof b['id'] === 'string' && b['id'] !== '' ? b['id'] : `${type}-${i + 1}`;
    out.push(Object.freeze({
      id,
      type,
      hidden,
      settings: resolveSettings(block.settings, provided !== null && typeof provided === 'object' ? (provided as Record<string, unknown>) : undefined, locale) as ThemeSettingListItem,
    }));
  }
  return out;
}
const EMPTY_RESOLVED: ReadonlyArray<ResolvedBlock> = Object.freeze([]);

/* ------------------------------------------------------------ section style (§7 `__style`) */

export const SECTION_STYLE_GROUP = 'Section style';

/**
 * The shared "Section style" fields the editor shows for every section whose schema does not set
 * `style: false`. Values live in `settings.__style` (and per-viewport paddings in `__responsive`);
 * the library `SectionFrame` applies them — themes never restyle them.
 */
export function sectionStyleFields(): ReadonlyArray<SettingField> {
  const g = SECTION_STYLE_GROUP;
  return [
    { id: 'padding_top', type: 'range', label: 'Padding top', group: g, default: 64, min: 0, max: 200, step: 4, responsive: true, css_property: 'padding-block' },
    { id: 'padding_bottom', type: 'range', label: 'Padding bottom', group: g, default: 64, min: 0, max: 200, step: 4, responsive: true, css_property: 'padding-block' },
    { id: 'background', type: 'select', label: 'Background', group: g, default: 'none', options: [
      { value: 'none', label: 'Theme default' }, { value: 'surface', label: 'Surface' }, { value: 'primary', label: 'Primary' }, { value: 'custom', label: 'Custom' },
    ] },
    { id: 'background_color', type: 'color', label: 'Background colour', group: g, default: '', hint: 'Used when background is Custom.' },
    { id: 'background_image', type: 'image', label: 'Background image', group: g, default: '', hint: 'Used when background is Custom.' },
    { id: 'container', type: 'select', label: 'Width', group: g, default: 'boxed', options: [
      { value: 'boxed', label: 'Boxed' }, { value: 'narrow', label: 'Narrow' }, { value: 'full', label: 'Full width' },
    ] },
    { id: 'text_align', type: 'select', label: 'Text alignment', group: g, default: 'auto', options: [
      { value: 'auto', label: 'Section default' }, { value: 'start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'End' },
    ] },
    { id: 'hide_mobile', type: 'toggle', label: 'Hide on mobile', group: g, default: false },
    { id: 'hide_desktop', type: 'toggle', label: 'Hide on desktop', group: g, default: false },
    { id: 'anchor', type: 'text', label: 'Anchor id', group: g, default: '', hint: 'Lets links jump to this section: #anchor' },
    { id: 'css_class', type: 'text', label: 'CSS class', group: g, default: '' },
  ];
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
