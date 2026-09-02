/**
 * Theme Registry — the authoritative catalogue of available themes, keyed by id.
 *
 * The engine core is theme-agnostic: it only asks the registry "is `id` known?" and "give me
 * its loader". Registering Theme 2 / Theme 3 later is a single `register()` call — no engine,
 * page, or component change. Themes may register eagerly or as lazy loaders (code-splitting).
 */
import { invariant } from '../../../shared/utils/invariant';
import type { ThemeLoader } from './types';

export interface RegisteredTheme {
  readonly id: string;
  readonly load: ThemeLoader;
  readonly manifestId: string;
}

export class ThemeRegistry {
  private readonly themes = new Map<string, { load: ThemeLoader; manifestId: string }>();

  /** Register a theme by id. Idempotent overwrite is disallowed to catch accidental clashes. */
  register(id: string, loader: ThemeLoader, manifestId: string = id): this {
    invariant(id.length > 0, 'theme id must be a non-empty string');
    invariant(manifestId.length > 0, 'theme manifest id must be a non-empty string');
    invariant(!this.themes.has(id), `theme "${id}" is already registered`);
    this.themes.set(id, { load: loader, manifestId });
    return this;
  }

  has(id: string): boolean {
    return this.themes.has(id);
  }

  /** Get a theme's loader, or `undefined` when the id is unknown. */
  get(id: string): ThemeLoader | undefined {
    return this.themes.get(id)?.load;
  }

  /** Expected manifest id can differ for a versioned runtime alias. */
  manifestId(id: string): string | undefined {
    return this.themes.get(id)?.manifestId;
  }

  /** Every registered theme id, in registration order. */
  list(): ReadonlyArray<string> {
    return Array.from(this.themes.keys());
  }

  entries(): ReadonlyArray<RegisteredTheme> {
    return Array.from(this.themes.entries()).map(([id, entry]) => ({ id, ...entry }));
  }
}

/** The process-wide registry the storefront app uses. Themes self-register into it. */
export const themeRegistry = new ThemeRegistry();
