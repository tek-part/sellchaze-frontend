# Theme 03 — Hearth · Home & Living

Warm, tactile home-retail storefront theme for the Sellchaze Theme Engine. Bespoke, isolated, and
token-driven — it reuses **only** the frozen platform contracts (engine, data contract, shared state
hooks) and shares **zero** visual DNA with Theme 01 (Luxury Fashion), Theme 02 (Voltage) or Theme 04
(Rouge).

- **Identity:** oat-and-clay canvas · walnut ink · **terracotta** (action) + **sage** (natural)
  accents · warm humanist serif (Fraunces) over a soft sans (General Sans) · **large soft 16–24px
  radii** · warm diffuse shadow (no glow) · gentle weighted motion · room-context photography.
- **Design source of truth:** `docs/themes/theme-03/` (000–25).
- **Preview:** `/storefront.html?theme=hearth` (`&scheme=dark` for the cozy dark map).

## Package structure

```
themes/hearth/
├── index.ts            ThemeModule: manifest + tokens + createTokens(settings) + sections/layouts/templates
├── manifest.ts         id/name/version/capabilities/settingsSchema
├── settings.ts         merchant-editable settings schema (10 canonical field types only)
├── tokens.ts           warm-light-first design tokens (light default + cocoa dark map)
├── theme.css           base design system + component skins (reads only var(--token))
├── chrome.css          header/footer/overlay skins
├── sections.css        section skins
├── index.test.ts       engine-validity + token-folding tests
├── components/         bespoke primitives (Button, Price, ProductCard, Gallery, forms, overlays, …)
├── chrome/             Header, Footer, CartDrawer, SearchOverlay, MobileNav, AnnouncementBar
├── layouts/            DefaultLayout (global shell; provides the shared cart)
└── sections/           bespoke sections + section-data/section-settings readers (+ tests)
```

## What it provides

- **Templates** for every core page the app resolves via `useTemplate()` → `ThemeRenderer`:
  `home · category · product · cart · checkout · search · wishlist · not-found · order-success`.
  When Hearth is active these render Hearth's own sections (no fallback to another theme).
- **Sections** (bespoke): roomset-hero, room-categories, category-story, product-grid, product-rail,
  featured-collection, shop-the-room, materials-story, large-gallery, testimonials, usp-band, faq,
  newsletter, rich-text, product-details (PDP), category-header, and the flow sections above.
- **Components** (bespoke, token-only): actions, typography, commerce (Price/Tag/Rating/ProductCard/
  Gallery/VariantPicker/QtyStepper/WishlistButton), forms (Input/Textarea/Select/Checkbox),
  overlays (Portal + focus-trap/scroll-lock hook), feedback (EmptyState/Skeleton/Spinner), motion
  (Reveal/useReveal).

## Contracts it reuses (never modifies)

- **Theme Engine** (`../theme-engine`) — registry, tokens→CSS projection, rendering, lifecycle.
- **Data contract** — `StorefrontContext` + shared catalog view-models (`../types/catalog`).
- **Shared state** — `useCart` (provided by this theme's layout), `useWishlist`, `useAuth`,
  `useRecentlyViewed` (provided at the app root).
- **Platform catalog** — Hearth is registered as a free, code-split entry (`platform/catalog`).

## Standards

- **Accessibility (WCAG 2.2 AA):** single terracotta focus ring, labelled forms with `aria`
  wiring, ≥44px targets, skip link, focus-trapped overlays, logical properties (RTL-safe), status
  never colour-only, `prefers-reduced-motion` honoured throughout.
- **SEO:** semantic headings/landmarks, crawlable links, meaningful `alt`; the core owns
  `<head>`/canonical/JSON-LD (the theme never emits head meta).
- **Performance:** SSR-friendly, fixed media aspect ratios (zero CLS), lazy images, skeletons,
  token-only CSS, compositor-friendly motion; no external runtime requests.
- **Data-gap honesty:** rating, stock, dimensions, materials, delivery, hotspots and reviews are
  data gaps — each degrades to a graceful fallback and is **never fabricated**.

## Payment

Checkout is a provider-hosted flow. The theme renders the surrounding shell only and **never** a raw
card / CVV / expiry field.

## Validation

```
npm run typecheck:storefront     # TypeScript (project)
npx eslint src/apps/storefront/themes/hearth
npx vitest run src/apps/storefront/themes/hearth
```
