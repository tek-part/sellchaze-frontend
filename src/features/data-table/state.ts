// Pure state helpers for the shared Shopify-style index tables (src/components/data-table).
// Framework-free so they run in the node test environment.
//
// URL shape (all optional, defaults omitted so links stay short and shareable):
//   ?view=<id>&q=<search>&sort=<by>:<asc|desc>&page=<n>&per=<n>&f.<filter>=<value>
// Filter values: select/text -> raw string, multi -> comma list, range -> "<min>..<max>".

export type SortDirection = 'asc' | 'desc';
export type FilterType = 'select' | 'multi' | 'text' | 'range' | 'date-range';
export type RangeValue = { min?: string; max?: string };
export type FilterValue = string | string[] | RangeValue;

export interface FilterOption { value: string; label: string }

export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  /** API parameter name (defaults to key). Ranges send `<param>_min`/`<param>_max`, date ranges `<param>_from`/`<param>_to`. */
  param?: string;
}

export interface TableState {
  view: string;
  search: string;
  sort: { by: string; direction: SortDirection } | null;
  page: number;
  perPage: number;
  filters: Record<string, FilterValue>;
}

export interface TableDefaults {
  view?: string;
  sort?: { by: string; direction: SortDirection } | null;
  perPage?: number;
  perPageOptions?: number[];
}

export const DEFAULT_PER_PAGE_OPTIONS = [25, 50, 100];

const isRange = (type: FilterType) => type === 'range' || type === 'date-range';

export function isEmptyValue(value: FilterValue | undefined): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return !(value.min ?? '').trim() && !(value.max ?? '').trim();
}

export function cleanFilters(filters: Record<string, FilterValue>): Record<string, FilterValue> {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => !isEmptyValue(value)));
}

function parseFilter(def: FilterDef, raw: string): FilterValue | undefined {
  if (isRange(def.type)) {
    const [min = '', max = ''] = raw.split('..');
    const value = { min: min.trim(), max: max.trim() };
    return isEmptyValue(value) ? undefined : value;
  }
  if (def.type === 'multi') {
    const values = raw.split(',').map((item) => item.trim()).filter(Boolean);
    const allowed = def.options?.length ? values.filter((item) => def.options!.some((option) => option.value === item)) : values;
    return allowed.length ? [...new Set(allowed)] : undefined;
  }
  if (def.type === 'select' && def.options?.length && !def.options.some((option) => option.value === raw)) return undefined;
  return raw.trim() ? raw : undefined;
}

function encodeFilter(def: FilterDef, value: FilterValue): string {
  if (isRange(def.type)) {
    const range = value as RangeValue;
    return `${range.min ?? ''}..${range.max ?? ''}`;
  }
  return Array.isArray(value) ? value.join(',') : String(value);
}

export function readState(params: URLSearchParams, defs: FilterDef[], defaults: TableDefaults = {}): TableState {
  const options = defaults.perPageOptions ?? DEFAULT_PER_PAGE_OPTIONS;
  const perPage = Number(params.get('per'));
  const page = Number(params.get('page'));
  const [by = '', direction = ''] = (params.get('sort') ?? '').split(':');
  const filters: Record<string, FilterValue> = {};
  for (const def of defs) {
    const raw = params.get(`f.${def.key}`);
    if (raw === null) continue;
    const value = parseFilter(def, raw);
    if (value !== undefined) filters[def.key] = value;
  }

  return {
    view: params.get('view') ?? defaults.view ?? 'all',
    search: params.get('q') ?? '',
    sort: by && (direction === 'asc' || direction === 'desc') ? { by, direction } : defaults.sort ?? null,
    page: Number.isInteger(page) && page > 1 ? page : 1,
    perPage: options.includes(perPage) ? perPage : defaults.perPage ?? options[0],
    filters,
  };
}

/** Query entries for the URL; values equal to the defaults are omitted. */
export function writeState(state: TableState, defs: FilterDef[], defaults: TableDefaults = {}): [string, string][] {
  const entries: [string, string][] = [];
  if (state.view && state.view !== (defaults.view ?? 'all')) entries.push(['view', state.view]);
  if (state.search.trim()) entries.push(['q', state.search]);
  const fallback = defaults.sort ?? null;
  if (state.sort && (state.sort.by !== fallback?.by || state.sort.direction !== fallback?.direction)) entries.push(['sort', `${state.sort.by}:${state.sort.direction}`]);
  if (state.page > 1) entries.push(['page', String(state.page)]);
  const perPage = defaults.perPage ?? (defaults.perPageOptions ?? DEFAULT_PER_PAGE_OPTIONS)[0];
  if (state.perPage !== perPage) entries.push(['per', String(state.perPage)]);
  for (const def of defs) {
    const value = state.filters[def.key];
    if (!isEmptyValue(value)) entries.push([`f.${def.key}`, encodeFilter(def, value as FilterValue)]);
  }
  return entries;
}

/** Laravel list conventions used across the dashboard API: search, sort_by, sort_direction, page, per_page. */
export function toApiParams(state: TableState, defs: FilterDef[]): Record<string, string | number> {
  const params: Record<string, string | number> = { page: state.page, per_page: state.perPage };
  if (state.search.trim()) params.search = state.search.trim();
  if (state.sort) {
    params.sort_by = state.sort.by;
    params.sort_direction = state.sort.direction;
  }
  for (const def of defs) {
    const value = state.filters[def.key];
    if (isEmptyValue(value)) continue;
    const name = def.param ?? def.key;
    if (isRange(def.type)) {
      const range = value as RangeValue;
      const [low, high] = def.type === 'date-range' ? ['from', 'to'] : ['min', 'max'];
      if ((range.min ?? '').trim()) params[`${name}_${low}`] = range.min!.trim();
      if ((range.max ?? '').trim()) params[`${name}_${high}`] = range.max!.trim();
    } else {
      params[name] = Array.isArray(value) ? value.join(',') : String(value);
    }
  }
  return params;
}

/** Human-readable chip text for an applied filter, e.g. "Status: Active, Draft" or "Price: 10 – 50". */
export function describeFilter(def: FilterDef, value: FilterValue, words: { from?: string; to?: string } = {}): string {
  const label = (item: string) => def.options?.find((option) => option.value === item)?.label ?? item;
  if (isRange(def.type)) {
    const range = value as RangeValue;
    const min = (range.min ?? '').trim();
    const max = (range.max ?? '').trim();
    const body = min && max ? `${min} – ${max}` : min ? `${words.from ?? '≥'} ${min}` : `${words.to ?? '≤'} ${max}`;
    return `${def.label}: ${body}`;
  }
  const values = Array.isArray(value) ? value : [String(value)];
  return `${def.label}: ${values.map(label).join(', ')}`;
}

/** A saved view only stores what defines the list (not the page). */
export type ViewState = Pick<TableState, 'search' | 'sort' | 'filters'> & { columns?: string[] };

export function viewStateOf(state: TableState, columns?: string[]): ViewState {
  return { search: state.search.trim(), sort: state.sort, filters: cleanFilters(state.filters), ...(columns ? { columns } : {}) };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Whether the current list differs from what the active view defines (Shopify's "unsaved view" state). */
export function viewChanged(state: TableState, view: ViewState, defaults: TableDefaults = {}): boolean {
  const current = viewStateOf(state);
  const target = { search: (view.search ?? '').trim(), sort: view.sort ?? defaults.sort ?? null, filters: cleanFilters(view.filters ?? {}) };
  return stable(current) !== stable(target);
}

export interface ColumnPrefs { order: string[]; hidden: string[] }

/** Apply saved order/visibility; new columns keep their declared position, unknown keys are dropped. */
export function arrangeColumns<T extends { key: string; defaultHidden?: boolean; hideable?: boolean }>(columns: T[], prefs?: Partial<ColumnPrefs> | null): T[] {
  const known = new Map(columns.map((column) => [column.key, column]));
  const order = (prefs?.order ?? []).filter((key) => known.has(key));
  const ordered = [...order, ...columns.map((column) => column.key).filter((key) => !order.includes(key))].map((key) => known.get(key)!);
  const hidden = new Set(prefs?.hidden ?? columns.filter((column) => column.defaultHidden).map((column) => column.key));

  return ordered.filter((column) => column.hideable === false || !hidden.has(column.key));
}

export function moveKey(keys: string[], key: string, offset: number): string[] {
  const from = keys.indexOf(key);
  const to = from + offset;
  if (from < 0 || to < 0 || to >= keys.length) return keys;
  const next = [...keys];
  next.splice(from, 1);
  next.splice(to, 0, key);
  return next;
}

/** Inclusive id range between two rows in display order, for shift-click selection. */
export function rangeBetween<T>(ids: T[], anchor: T, target: T): T[] {
  const a = ids.indexOf(anchor);
  const b = ids.indexOf(target);
  if (a < 0 || b < 0) return [target];
  return ids.slice(Math.min(a, b), Math.max(a, b) + 1);
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  // Leading = + - @ would be evaluated as formulas by Excel/Sheets.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** UTF-8 CSV with BOM so Arabic opens correctly in Excel. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return `﻿${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
