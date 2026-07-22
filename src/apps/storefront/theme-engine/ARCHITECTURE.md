# Storefront Theme Engine — Internal Architecture (frozen)

> Engineering reference for `src/apps/storefront/theme-engine`. The engine is **theme-agnostic**:
> it knows how to load, validate, and render *a* theme, never anything about Theme 1. Adding
> Theme 2/3 or a plugin never changes engine code. Mirrors the design contract in
> `docs/THEME-ENGINE-V2.md`. **Frozen** — treat the public surface (`index.ts`) as stable.

## Layers

```
StorefrontEngineProvider  (plugins → PluginManager: lifecycle + slots + services)   ← engine layer
  └─ ThemeProvider        (load active theme → resolve settings → tokens → CSS vars) ← theme layer
      └─ <app / pages>
          └─ ThemeRenderer(page, context)   Engine → Renderer → Sections → Components ← render layer
              └─ theme.sections[type]  (theme-owned components; isolated per section)
          └─ <Slot name="…">           (plugin-filled extension points)
```

- **Engine layer** (`StorefrontEngineProvider` / `EngineContext`) is independent of the active
  theme; plugins + slots live here and outlive theme swaps.
- **Theme layer** (`ThemeProvider` / `ThemeContext`) resolves the active `ThemeModule`: validates
  & coerces merchant settings, folds them into tokens, projects tokens as `--css-vars`, manages
  colour scheme (`auto`/light/dark), direction (LTR/RTL), reduced-motion.
- **Render layer** (`ThemeRenderer`) turns a `PageDefinition` into rendered sections using the
  active theme's `SectionRegistry` — the renderer never imports a theme.

## Rendering flow

1. Host mounts `<StorefrontThemeRoot themeId settings plugins>` → `StorefrontEngineProvider`
   (composes plugins) → `ThemeProvider` (loads theme).
2. `ThemeProvider` calls `loadTheme({registry, id, fallbackId})` — fail-closed: unknown id →
   `fallbackId`; result memoised. Resolves `settings` (`resolveSettings`, fail-safe) → `tokens`
   (`module.createTokens`) → `applyTokensToElement` writes `--vars` + `dir` + `data-theme`.
3. A page renders `<ThemeRenderer page={PageDefinition} context={StorefrontContext} />`:
   - fires `beforeRender` + `beforePage` (pre-paint), then per section:
   - looks up `theme.sections[instance.type]`; **unknown type → dropped** (graceful degradation);
   - renders it inside `SectionErrorBoundary` (**fail-closed**: a throwing section is skipped, page
     survives), firing `beforeSection`/`afterSection` around it;
   - fires `afterPage` + `afterRender` (post-paint).
4. Themes place `<Slot name="…">` where plugins may inject content.

## Public contracts (`index.ts`)

| Contract | Shape | Owner |
|---|---|---|
| `ThemeModule` | `{ manifest, tokens, defaultSettings, createTokens, sections?, layouts?, templates?, lifecycle? }` | theme |
| `ThemeManifest` | id, name, version, **minEngineVersion**, supports{colorSchemes,rtl}, settingsSchema | theme |
| `DesignTokens` | colour(light+dark) · type · spacing · radius · shadow · motion · size · z · breakpoints | theme |
| `SectionComponent` | `(props: {instance, settings, context}) => JSX` | theme |
| `SectionRegistry` | `Record<type, SectionComponent>` | theme |
| `PageDefinition` | `{ template, sections: SectionInstance[] }` | theme/CMS |
| `StorefrontContext` | `{ store, seo, navigation, data }` (read-only tenant data) | host/API |
| `ThemeLifecycle` | before/after `Render`·`Page`·`Section` (side-effect only) | theme + plugins |
| `StorefrontPlugin` | `{ id, version, setup(ctx) }` | plugin |

Themes provide `sections/layouts/templates/lifecycle` **in later phases**; they are optional so the
Phase-1 token-only theme is valid today.

## Versioning & compatibility

- `ENGINE_VERSION` (`compatibility.ts`) — bump on breaking changes to the theme contract.
- A theme declares `manifest.minEngineVersion`; `checkThemeCompatibility` refuses a theme the
  engine is too old for (semver via `semver.ts`). Enforced by `validateTheme`.

## Validation pipeline (`validation.ts`)

`validateTheme(module)` → `{ valid, errors[], warnings[] }` (never throws). Checks: manifest
(id/semver/compatibility/supports), settings schema (unique ids, select options/default,
range bounds), tokens (ascending breakpoints, non-empty ramps, `createTokens` sanity), and
sections/templates (**every template section type must be a declared section**; warns on missing
home/product/category). Run at registration / in dev.

## Extension points (plugins + slots)

- A **plugin** (`StorefrontPlugin.setup(ctx)`) may `registerLifecycle`, `registerSlot(name, render,
  {order})`, and `registerService/getService`. Plugins are **optional storefront features**
  (analytics, recently-viewed, reviews, consent…) — never theme styling.
- `PluginManager` composes them (setup runs once, fail-safe). `<Slot name>` renders a slot's
  contributions in `order`. Themes must render correctly with **zero** slot content.

## Lifecycle

`LifecycleManager.add(hook)` (returns unsubscribe); `ThemeRenderer` folds the active theme's
`lifecycle` into the shared manager for its subtree. Every hook call is wrapped fail-safe — a
throwing hook is logged, never breaks the render. Hooks are **observers only**; they never alter
output.

## Adding a theme (no engine change)

1. Create `themes/<key>/` exporting a `ThemeModule` (`manifest` with a fresh `id`, `tokens`,
   `createTokens`, and — later — `sections/layouts/templates`).
2. `themeRegistry.register('<key>', () => import('./<key>').then(m => m.default))` in
   `themes/registry.ts` (lazy → its own code-split chunk).
3. `validateTheme` in dev. Done — pages/components/engine untouched.

## Adding a plugin (no theme/engine change)

Implement `StorefrontPlugin`; pass it to `<StorefrontThemeRoot plugins={[…]}>`. It registers
lifecycle/slots/services at init.

## Registry-driven resolution (frozen)

Nothing resolves a concrete component directly — **everything is reached by key through a
`Registry<T>`**. A theme provides authoring maps (`sections`, `layouts`, `widgets`, `templates`);
the engine wraps them into `ThemeRegistries` (`buildThemeRegistries`) exposed on the context.

- **Sections** — `registries.sections.resolve(instance.type)` in `ThemeRenderer` (unknown → dropped).
- **Widgets** — `<Widget name>` → `registries.widgets.resolve(name)`; sections/layouts compose shared
  widgets by key instead of importing them.
- **Layouts** — `useLayout(name)` → `registries.layouts.resolve(name)`.
- **Templates** — `useTemplate(name)` → `registries.templates.resolve(name)` (a `PageDefinition`).

Templates reference sections by **string key** only. A theme never hands the renderer a component
reference; it registers components under keys and the pipeline resolves them. Fail-closed: a missing
key resolves to `undefined` and renders nothing.

## Capabilities (feature detection, never name checks)

`manifest.capabilities: ThemeCapability[]` declares what a theme can do (`rtl`, `dark-mode`,
`mega-menu`, `wishlist`, …; open set). The engine and feature code decide availability from this
list — **never** `if (theme.id === 'x')`. Use `hasCapability(manifest, cap)`, the `useCapability`
hook, or `<Capability name>…</Capability>`. This keeps the engine free of theme-specific conditionals.

## Manifest migration (schema evolution)

`manifest.schemaVersion` records the manifest SHAPE version. When the shape changes, add a migration
to `MANIFEST_MIGRATIONS` (`from → to`, additive). On load, `migrateManifest` runs the chain from a
theme's declared version up to `CURRENT_MANIFEST_SCHEMA_VERSION` **before validation/rendering**, so
older themes keep working after engine upgrades. Idempotent for current manifests; never throws.
Wired in `loader.ts` (every loaded module's manifest is normalised).

## Invariants (do not break)

I1 no theme-specific code in the engine · I2 fail-closed (section/plugin/hook failures isolated;
unknown theme → fallback; unknown section → dropped) · I7 everything visual is a token
(`var(--token)`) · engine imports only `src/shared` utils, never dashboard code.
