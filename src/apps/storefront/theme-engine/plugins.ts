/**
 * Plugin / extension architecture for OPTIONAL storefront features (analytics, recently-viewed,
 * reviews, live-search, cookie-consent, …). Plugins are theme-agnostic: they contribute
 * lifecycle hooks, slot content, and services — never theme styling. A theme renders extension
 * points via `<Slot name="…" />`; plugins fill them. The engine composes plugins deterministically.
 */
import type { ComponentType } from 'react';
import { LifecycleManager, type ThemeLifecycle } from './lifecycle';
import type { StorefrontContext } from './rendering';

export interface SlotRenderProps {
  readonly context: StorefrontContext | null;
}

export type SlotRenderer = ComponentType<SlotRenderProps>;

export interface SlotEntry {
  readonly pluginId: string;
  readonly order: number;
  readonly render: SlotRenderer;
}

/** Named extension points a theme exposes and plugins fill. */
export class SlotRegistry {
  private readonly slots = new Map<string, SlotEntry[]>();

  add(name: string, entry: SlotEntry): void {
    const list = this.slots.get(name) ?? [];
    list.push(entry);
    list.sort((a, b) => a.order - b.order);
    this.slots.set(name, list);
  }

  get(name: string): ReadonlyArray<SlotEntry> {
    return this.slots.get(name) ?? [];
  }

  names(): ReadonlyArray<string> {
    return Array.from(this.slots.keys());
  }
}

/** The surface a plugin uses at setup time to contribute to the engine. */
export interface StorefrontPluginContext {
  registerLifecycle(hook: ThemeLifecycle): void;
  registerSlot(name: string, render: SlotRenderer, options?: { readonly order?: number }): void;
  registerService<T>(key: string, value: T): void;
  getService<T>(key: string): T | undefined;
}

export interface StorefrontPlugin {
  readonly id: string;
  readonly version: string;
  /** Called once during engine init. Register lifecycle/slots/services here. */
  setup(ctx: StorefrontPluginContext): void;
}

/** Composes plugins into aggregated lifecycle hooks, slot content, and a service locator. */
export class PluginManager {
  readonly lifecycle = new LifecycleManager();
  readonly slots = new SlotRegistry();
  private readonly plugins: StorefrontPlugin[] = [];
  private readonly services = new Map<string, unknown>();
  private initialised = false;

  use(plugin: StorefrontPlugin): this {
    if (this.plugins.some((p) => p.id === plugin.id)) {
      throw new Error(`[theme-engine] plugin "${plugin.id}" is already registered`);
    }
    this.plugins.push(plugin);
    return this;
  }

  list(): ReadonlyArray<StorefrontPlugin> {
    return this.plugins.slice();
  }

  /** Run each plugin's `setup` exactly once. Idempotent. */
  init(): void {
    if (this.initialised) return;
    this.initialised = true;
    for (const plugin of this.plugins) {
      const ctx: StorefrontPluginContext = {
        registerLifecycle: (hook) => this.lifecycle.add(hook),
        registerSlot: (name, render, options) =>
          this.slots.add(name, { pluginId: plugin.id, order: options?.order ?? 0, render }),
        registerService: (key, value) => this.services.set(key, value),
        getService: <T>(key: string): T | undefined => this.services.get(key) as T | undefined,
      };
      try {
        plugin.setup(ctx);
      } catch (error) {
        // Fail-safe: a broken optional plugin must not take down the storefront.
        console.error(`[theme-engine] plugin "${plugin.id}" setup failed:`, error);
      }
    }
  }

  getService<T>(key: string): T | undefined {
    return this.services.get(key) as T | undefined;
  }
}
