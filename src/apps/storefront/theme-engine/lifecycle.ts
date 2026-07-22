/**
 * Theme lifecycle hooks — cross-cutting, side-effect-only observers around the render pipeline
 * (before/after render, page, section). Used by themes AND plugins for analytics, scroll
 * restoration, logging, etc. Hooks NEVER affect output and are fail-safe: a throwing hook is
 * isolated and logged, never crashing the render (docs I2). Theme-agnostic.
 */
import type { PageDefinition, SectionInstance, StorefrontContext } from './rendering';

export interface RenderPhaseInfo {
  readonly context: StorefrontContext;
  readonly page: PageDefinition;
}

export interface SectionPhaseInfo {
  readonly context: StorefrontContext;
  readonly instance: SectionInstance;
  readonly index: number;
}

export interface ThemeLifecycle {
  onBeforeRender?(info: RenderPhaseInfo): void;
  onAfterRender?(info: RenderPhaseInfo): void;
  onBeforePage?(info: RenderPhaseInfo): void;
  onAfterPage?(info: RenderPhaseInfo): void;
  onBeforeSection?(info: SectionPhaseInfo): void;
  onAfterSection?(info: SectionPhaseInfo): void;
}

type LifecycleMethod = keyof ThemeLifecycle;

export class LifecycleManager {
  private readonly hooks = new Set<ThemeLifecycle>();

  /** Register a set of hooks. Returns an unsubscribe function. */
  add(hook: ThemeLifecycle): () => void {
    this.hooks.add(hook);
    return () => {
      this.hooks.delete(hook);
    };
  }

  private emit<M extends LifecycleMethod>(method: M, info: Parameters<NonNullable<ThemeLifecycle[M]>>[0]): void {
    for (const hook of this.hooks) {
      const fn = hook[method];
      if (!fn) continue;
      try {
        (fn as (arg: typeof info) => void).call(hook, info);
      } catch (error) {
        // Fail-safe: a broken lifecycle hook must never break rendering.
        console.error(`[theme-engine] lifecycle hook "${method}" threw:`, error);
      }
    }
  }

  beforeRender(info: RenderPhaseInfo): void { this.emit('onBeforeRender', info); }
  afterRender(info: RenderPhaseInfo): void { this.emit('onAfterRender', info); }
  beforePage(info: RenderPhaseInfo): void { this.emit('onBeforePage', info); }
  afterPage(info: RenderPhaseInfo): void { this.emit('onAfterPage', info); }
  beforeSection(info: SectionPhaseInfo): void { this.emit('onBeforeSection', info); }
  afterSection(info: SectionPhaseInfo): void { this.emit('onAfterSection', info); }
}
