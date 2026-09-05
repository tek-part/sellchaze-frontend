/**
 * Theme module → backend manifest JSON (contract §2, `resources/themes/storefront/<key>.json`).
 *
 * Pure conversion, no I/O: `scripts/export-theme-manifests.ts` loads each catalogued theme and
 * writes what `buildBackendManifest()` returns. Kept inside the storefront tree so it is
 * type-checked and unit-tested with the engine types it converts.
 */
import type { CatalogEntry } from '../catalog/types';
import type {
  ThemeModule,
  ThemeSectionSchema,
  ThemeSettingField,
  ThemeSettingsSchema,
} from '../../theme-engine/types';
import type { PageDefinition, SectionInstance, TemplateMap } from '../../theme-engine/rendering';

/* ------------------------------------------------------------------ JSON shapes */

export interface BackendField {
  id: string;
  type: string;
  label: string;
  default: unknown;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  translatable?: boolean;
  item?: BackendField[];
  responsive?: boolean;
  css_property?: string;
}

export interface BackendSettingsGroup {
  id: string;
  label: string;
  fields: BackendField[];
}

export interface BackendSectionSchema {
  label: string;
  description?: string;
  category: string;
  icon?: string;
  settings: BackendField[];
  presets?: Array<{ label: string; settings: Record<string, unknown> }>;
}

export interface BackendTemplate {
  sections: Array<{ type: string; settings: Record<string, unknown> }>;
}

export interface BackendThemeManifest {
  key: string;
  name: string;
  version: string;
  author: string;
  category: string;
  description: string;
  is_marketplace: true;
  is_featured: boolean;
  min_platform_version: string;
  preview_image: string;
  supported_features: string[];
  bundle_url: string;
  changelog: string;
  settings_schema: BackendSettingsGroup[];
  sections_schema: Record<string, BackendSectionSchema>;
  templates: Record<string, BackendTemplate>;
}

/* ------------------------------------------------------------------ helpers */

export function slugify(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'general';
}

/** One field → its JSON (drops `group`/`help`, maps `help` → `hint`, recurses into list items). */
export function fieldToJson(field: ThemeSettingField): BackendField {
  const out: BackendField = { id: field.id, type: field.type, label: field.label, default: field.default };
  const hint = field.hint ?? field.help;
  if (hint) out.hint = hint;
  if (field.translatable) out.translatable = true;
  if (field.responsive) out.responsive = true;
  if (field.css_property) out.css_property = field.css_property;
  switch (field.type) {
    case 'select':
      out.options = field.options.map((o) => ({ value: o.value, label: o.label }));
      break;
    case 'range':
    case 'number':
      if (field.min !== undefined) out.min = field.min;
      if (field.max !== undefined) out.max = field.max;
      if (field.step !== undefined) out.step = field.step;
      break;
    case 'list':
      out.item = field.item.map(fieldToJson);
      if (field.max !== undefined) out.max = field.max;
      break;
    default:
      break;
  }
  return out;
}

/** Flat theme settings (fields carry `group`) → grouped `settings_schema`, first-seen group order. */
export function groupSettingsSchema(schema: ThemeSettingsSchema): BackendSettingsGroup[] {
  const groups: BackendSettingsGroup[] = [];
  const byId = new Map<string, BackendSettingsGroup>();
  for (const field of schema) {
    const label = field.group?.trim() || 'General';
    const id = slugify(label);
    let group = byId.get(id);
    if (!group) {
      group = { id, label, fields: [] };
      byId.set(id, group);
      groups.push(group);
    }
    group.fields.push(fieldToJson(field));
  }
  return groups;
}

/** Section schemas → `sections_schema` map keyed by type (insertion order preserved). */
export function toSectionsSchema(schemas: ReadonlyArray<ThemeSectionSchema>): Record<string, BackendSectionSchema> {
  const out: Record<string, BackendSectionSchema> = {};
  for (const s of schemas) {
    const entry: BackendSectionSchema = { label: s.label, category: s.category, settings: s.settings.map(fieldToJson) };
    if (s.description) entry.description = s.description;
    if (s.icon) entry.icon = s.icon;
    if (s.presets && s.presets.length > 0) entry.presets = s.presets.map((p) => ({ label: p.label, settings: { ...p.settings } }));
    out[s.type] = entry;
  }
  return out;
}

function instanceToJson(instance: SectionInstance): { type: string; settings: Record<string, unknown> } {
  return { type: instance.type, settings: { ...(instance.settings ?? {}) } };
}

/** Templates → `{ home | product | category: { sections } }` (only the three the backend seeds). */
export function toTemplates(templates: TemplateMap | undefined): Record<string, BackendTemplate> {
  const out: Record<string, BackendTemplate> = {};
  for (const name of ['home', 'product', 'category'] as const) {
    const page: PageDefinition | undefined = templates?.[name];
    if (page) out[name] = { sections: page.sections.map(instanceToJson) };
  }
  return out;
}

/**
 * The full backend manifest for one theme. Section schemas come from `module.sectionSchemas`
 * (library themes); for legacy themes without schemas every registered section type gets a
 * minimal `{ label, settings: [] }` entry so the editor can still list them.
 */
export function buildBackendManifest(module: ThemeModule, entry?: CatalogEntry): BackendThemeManifest {
  const m = module.manifest;
  const schemas: ThemeSectionSchema[] = [...(module.sectionSchemas ?? [])];
  const known = new Set(schemas.map((s) => s.type));
  for (const type of Object.keys(module.sections ?? {})) {
    if (!known.has(type)) schemas.push({ type, label: type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), category: 'content', settings: [] });
  }
  // Only types the theme actually renders are advertised to the editor.
  const renderable = new Set(Object.keys(module.sections ?? {}));
  const advertised = renderable.size > 0 ? schemas.filter((s) => renderable.has(s.type)) : schemas;

  const changelog = entry?.changelog?.length
    ? entry.changelog.map((c) => `${c.version} (${c.date}): ${c.notes.join(' ')}`).join('\n')
    : 'Initial release.';

  return {
    key: m.id,
    name: m.name,
    version: m.version,
    author: m.author,
    category: m.category ?? slugify(m.archetype.split(/\s+/)[0] ?? 'general'),
    description: m.description,
    is_marketplace: true,
    is_featured: Boolean(entry?.featured),
    min_platform_version: m.minEngineVersion,
    preview_image: m.previewImage ?? entry?.previewImage ?? `/media/theme-previews/${m.id}.svg`,
    supported_features: [...m.capabilities],
    bundle_url: `builtin:${m.id}@${m.version}`,
    changelog,
    settings_schema: groupSettingsSchema(m.settingsSchema),
    sections_schema: toSectionsSchema(advertised),
    templates: toTemplates(module.templates),
  };
}
