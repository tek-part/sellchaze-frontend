# Building a theme on the section library

The library (`src/apps/storefront/sections-lib`) ships 34 editor-ready sections (schema + component),
token-driven `lib-*` styles, data readers and base templates. A theme built on it only writes its
**chrome** (header/footer/drawers), **tokens/settings** and a **skin**. Reference: `themes/naseem`.

## 1. Scaffold `themes/<id>/`
```
manifest.ts   settings.ts   tokens.ts   index.ts   templates.ts   theme.css   shared.css
layouts/DefaultLayout.tsx + layouts/index.ts
chrome/{Header,Footer,MobileNav,CartDrawer,SearchOverlay,AnnouncementBar}.tsx
```
`index.ts` (copy from naseem and adjust):
```ts
export const myTheme: ThemeModule = {
  manifest, defaultSettings: baseline, tokens: createTokens(baseline), createTokens,
  sections: createSectionMap({ /* 'hero-slider': MyHero */ }),   // library + overrides, all framed
  sectionSchemas: SECTION_LIBRARY,                                 // or mergeSectionSchemas([mySchema])
  layouts, templates: baseTemplates({ home: myHomeSections }),
};
```
Manifest: `id` kebab-case, `category`, `previewImage: '/media/theme-previews/<id>.jpg'`,
`schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION`, `supports.colorSchemes`, `capabilities`, `minEngineVersion: '1.0.0'`.

## 2. Settings, tokens, chrome, templates, skin
`settings.ts` is a flat `ThemeSettingsSchema` (every field carries `group`; translatable text =
`translatable: true` + `default: { ar, en }`). `createTokens(settings)` is pure and only tokens reach CSS.
`DefaultLayout` renders AnnouncementBar → Header → `<main id="sf-main">` → Footer + drawers inside
`ToastProvider` + `CartProvider`. `baseTemplates({ home })` returns home/product/category; home is
`SectionInstance[]` of library types with **raw** settings (`tr('عربي','English')` maps, lists, `blocks`).
`theme.css` = chrome classes + optional `.my-root .lib-card {…}` tweaks using tokens only; `shared.css`
reskins the shared `.sf-*` route pages (cart/checkout/search/account/…).

## 3. Section anatomy (contract §7: variants · blocks · section style)
```ts
const LAYOUTS = variants('layout', [{ value: 'grid', label: 'Grid', description: '…', icon: 'HiOutlineSquares2X2' }, …],
  { style: { plain: 'icons-row' } });                       // optional legacy key/value → variant map
const item = defineBlock({ type: 'feature', label: 'Feature', icon: 'HiOutlineSparkles', settings: [...], limit: 8 });
export const mySchema = defineSection({
  type: 'my-thing', label, category, icon,
  variants: LAYOUTS,                                         // visual picker; value stored in settings.layout
  blocks: { types: [item], max: 8, legacy: 'items' },        // `legacy` = the old list field (kept for old data)
  settings: [variantSelect(LAYOUTS, 'grid'), fields.text('title','Title', tr('..','..')), fields.list('items', …)],
  presets: [{ label: 'Three reasons', settings: { blocks: DEMO_BLOCKS } }],   // editor inserts blocks from presets
});
export function MyThing(props: SectionRenderProps) {
  const s = useSectionSettings(mySchema, props.settings);   // defaults filled, locale picked, never throws
  const layout = useVariant(mySchema, props.settings);      // stored → legacy map → select default
  const blocks = useSectionBlocks(mySchema, s, undefined, DEMO_BLOCKS); // settings.blocks → legacy list → demo
  const data = useSectionData(props.context);               // products(key), product(id), categories(), faq()…
  return <LibSection title={str(s,'title')} style={spacingStyle(s)}>{blocks.map((b) => str(b.settings, 'title'))}</LibSection>;
}
```
* **Variants** are one `select` field mirrored by `schema.variants` (the editor draws the picker and
  hides the select). Add a real rendering per option — never a no-op label.
* **Blocks** are stored as `settings.blocks = [{ id, type, hidden, settings }]`. `resolveBlocks()` drops
  unknown types and hidden blocks, applies `max`/`limit`, resolves each block against its schema and,
  when `blocks` is absent/empty, synthesises blocks from the `legacy` list (stored value, then the list
  default) — so pre-§7 data and `settings = {}` both render. New sections without a legacy list pass
  demo blocks as the `fallback` and expose the same array through a preset.
* **Section style** (`settings.__style` + `__responsive`) is applied by `SectionFrame`, which
  `createSectionMap()` wraps around every component (theme overrides included): padding top/bottom
  (`--lib-frame-pt/--lib-frame-pb`, tablet ≤1023 / mobile ≤767 overrides via a per-section `<style>`),
  background (surface | primary | custom colour/image), container (boxed | narrow | full), text
  alignment, hide on mobile/desktop, anchor id, css class. `sectionStyleFields()` is the editor's field
  list; the frame renders inside the engine's `data-section-id` wrapper, so selection still works.
  Sections keep their own `.lib-section` padding default (`spacingFields` / `--lib-pb`) until a
  merchant sets a frame padding. Roots that are not a `LibSection` (hero, strip) honour the frame vars
  through `.lib-frame > :is(.lib-hero-slider, .lib-strip)`.
* Rules: render something sensible with `settings = {}`; no `stopPropagation` on the root; logical CSS
  properties only; `LibCarousel` for rails; shared product layouts come from `ProductSet`.

## 4. Register + export
Append a `CatalogEntry` in `platform/catalog/catalog.ts` (`load: () => import('../../themes/<id>')`),
add `public/media/theme-previews/<id>.jpg` (1200×800, `node scripts/capture-theme-previews.mjs <id>`), then
`npm run themes:manifests -- <id>` (writes `../sellchaze-backend/resources/themes/storefront/<id>.json`
with `variants`, `blocks` and `style` per section) and `php artisan themes:register` in the backend.
Verify: `npm run typecheck && npx eslint src/apps/storefront --max-warnings 0 && npx vitest run && npm run build`,
then open `http://localhost:5173/?preview=1&theme=<id>` (and `&lang=ar`).
