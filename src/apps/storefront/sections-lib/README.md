# Building a theme on the section library

The library (`src/apps/storefront/sections-lib`) ships 26 editor-ready sections (schema + component),
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
  sections: createSectionMap({ /* 'hero-slider': MyHero */ }),   // library + optional overrides
  sectionSchemas: SECTION_LIBRARY,                                 // or mergeSectionSchemas([mySchema])
  layouts, templates: baseTemplates({ home: myHomeSections }),
};
```
Manifest: `id` kebab-case, `category`, `previewImage: '/media/theme-previews/<id>.svg'`,
`schemaVersion: CURRENT_MANIFEST_SCHEMA_VERSION`, `supports.colorSchemes`, `capabilities`, `minEngineVersion: '1.0.0'`.

## 2. Settings + tokens
`settings.ts` is a flat `ThemeSettingsSchema`; every field carries `group` (the export groups them).
Translatable text: `translatable: true`, `default: { ar, en }`. `createTokens(settings)` is pure:
colours → `color.light/dark`, fonts → `typography.fontSans` (`--font`) / `fontSerif` (`--heading`),
`container_width` → `spacing.container`, radius preset → `radius`. Only tokens reach CSS (`var(--token)`).

## 3. Chrome + layout
`DefaultLayout` renders AnnouncementBar → Header → `<main id="sf-main">` → Footer + CartDrawer/MobileNav/
SearchOverlay, wrapped in `ToastProvider` + `CartProvider` (the library PDP needs the toast). Read
`context.navigation.header/footer` (NavItem/FooterGroup), `useStore()` for the logo, `useCart()`,
`useWishlist()`, `useThemeSettings()`. Reusing luxury's `Drawer`/`SearchOverlay` primitives is fine
(they are app-level styled); give your own markup a unique class prefix.

## 4. Templates
`baseTemplates({ home })` returns home/product/category. Home is `SectionInstance[]` of library
types with **raw** settings (bilingual `tr('عربي', 'English')` maps allowed, list fields as arrays).
Cart/checkout/search/wishlist/account/auth/static/404 are shared route pages that render `.sf-*`
markup when no template exists — reskin them in `shared.css` instead of building templates.

## 5. Skin
`theme.css` = chrome classes + optional library tweaks (`.my-root .lib-card {…}`, or the
`--lib-card-ratio` / `--lib-pb` custom properties). Never restyle `.lib-*` with literal colours —
use tokens so merchant settings apply. `shared.css` overrides `.sf-*` for the shared pages.

## 6. Section components (when overriding / adding)
```ts
export const mySchema = defineSection({ type: 'my-thing', label, category, icon, settings: [fields.text('title','Title', tr('..','..')), fields.list('items','Items',[...], defaults, max)] });
export function MyThing(props: SectionRenderProps) {
  const s = useSectionSettings(mySchema, props.settings);   // defaults filled, locale picked, never throws
  const data = useSectionData(props.context);               // products(key), categories(), brands(), faq()…
  return <LibSection title={str(s,'title')} style={spacingStyle(s)}>…</LibSection>;
}
```
Rules: render something sensible with `settings = {}`; no `stopPropagation` on the root (customizer
click-select); logical CSS properties only; `LibCarousel` for rails (scroll-snap, no deps).

## 7. Register + export
Append a `CatalogEntry` in `platform/catalog/catalog.ts` (`load: () => import('../../themes/<id>')`),
add `public/media/theme-previews/<id>.svg` (1200×800), then `npm run themes:manifests` (writes
`../sellchaze-backend/resources/themes/storefront/<id>.json`; `--all` overwrites existing) and
`php artisan themes:register` in the backend. Verify: `npm run typecheck && npx eslint src/apps/storefront/themes/<id>
&& npx vitest run && npm run build`, then open `http://localhost:5173/?preview=1&theme=<id>` (and `&lang=ar`).
