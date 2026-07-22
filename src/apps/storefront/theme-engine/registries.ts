/**
 * Content registries — the resolution layer for everything a theme provides (sections, layouts,
 * widgets, templates). The rendering pipeline resolves ONLY through these registries, keyed by
 * string. Nothing (renderer, section, layout, other theme) references a concrete component
 * directly — a component is reached exclusively via `registry.resolve(key)`.
 */
import type {
  LayoutComponent,
  PageDefinition,
  SectionComponent,
  WidgetComponent,
} from './rendering';

/** A read-through registry of `key` → `T`. Missing keys resolve to `undefined` (fail-closed). */
export class Registry<T> {
  private readonly items = new Map<string, T>();

  constructor(
    /** Human label for diagnostics (e.g. "section"). */
    readonly kind: string,
    initial?: Readonly<Record<string, T>>,
  ) {
    if (initial) this.registerAll(initial);
  }

  register(key: string, value: T): this {
    this.items.set(key, value);
    return this;
  }

  registerAll(map: Readonly<Record<string, T>>): this {
    for (const [key, value] of Object.entries(map)) this.items.set(key, value);
    return this;
  }

  resolve(key: string): T | undefined {
    return this.items.get(key);
  }

  has(key: string): boolean {
    return this.items.has(key);
  }

  keys(): ReadonlyArray<string> {
    return Array.from(this.items.keys());
  }

  get size(): number {
    return this.items.size;
  }
}

/** The complete set of registries resolved for the active theme. */
export interface ThemeRegistries {
  readonly sections: Registry<SectionComponent>;
  readonly layouts: Registry<LayoutComponent>;
  readonly widgets: Registry<WidgetComponent>;
  readonly templates: Registry<PageDefinition>;
}

export interface ThemeContentMaps {
  readonly sections?: Readonly<Record<string, SectionComponent>>;
  readonly layouts?: Readonly<Record<string, LayoutComponent>>;
  readonly widgets?: Readonly<Record<string, WidgetComponent>>;
  readonly templates?: Readonly<Record<string, PageDefinition>>;
}

/** Wrap a theme's authoring maps into resolvable registries. */
export function buildThemeRegistries(maps: ThemeContentMaps): ThemeRegistries {
  return {
    sections: new Registry<SectionComponent>('section', maps.sections),
    layouts: new Registry<LayoutComponent>('layout', maps.layouts),
    widgets: new Registry<WidgetComponent>('widget', maps.widgets),
    templates: new Registry<PageDefinition>('template', maps.templates),
  };
}
