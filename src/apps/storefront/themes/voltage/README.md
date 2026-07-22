# Theme 02 — Voltage · Tech Commerce

A fully independent storefront theme: dark-first "carbon + voltage-cyan + signal-lime" spec-commerce
language. Voltage shares **only** the frozen theme engine, the registries/renderer, the storefront data
contract, the shared state (cart/wishlist/auth) and the shared APIs with the rest of the platform. It
reuses **no** Theme 01 markup, styling, or components — its own `.vlt-*` namespace throughout.

## Activate

```
/storefront.html?theme=voltage&scheme=dark   (default)
/storefront.html?theme=voltage&scheme=light
```

Registered in `themes/registry.ts` as a lazy chunk, so only the active theme's JS+CSS load.

## Structure

```
voltage/
  manifest.ts         theme id, name, supported colour schemes, capabilities (rtl, dark-mode)
  settings.ts         merchant settings schema (colour scheme, brand colours, container width)
  tokens.ts           DesignTokens (dark + light colour maps, type, spacing, radius, shadow, motion)
  index.ts            ThemeModule: manifest + tokens + createTokens + sections + layouts + templates
  theme.css           design system + component skin (.vlt-* base, buttons, cards, PDP…)
  sections.css        section layouts (hero, grids, flow pages, 9 marketing sections)
  chrome.css          header / nav / footer / mobile
  overlays.css        drawer, modal, toast, mini-cart, search overlay, compare, quick view, reveal
  components/         30 own components + overlay hooks (useOverlay, useReveal) + toast/
  sections/           24 section components + section-settings/section-data readers (+ tests)
  chrome/             Header, Footer, CartDrawer, SearchOverlay, MobileNav, CompareTray
  layouts/            DefaultLayout (global chrome), AccountLayout (account sidebar shell)
  state/              compare-context (theme-local compare set, max 4)
```

## Page coverage (21 templates)

Home · Category · Product (PDP) · Cart · Wishlist · Search · Login · Register · Forgot / Reset password ·
Checkout · Order success · Account (Profile / Orders / Order detail / Addresses) · Blog · About ·
Contact · FAQ · 404.

Flow pages are template-driven: the shared page resolves `useTemplate(name)` / `useLayout('account')`
and renders Voltage's sections, falling back to the reference theme when a theme registers none — so the
engine and other themes are untouched.

## Section vocabulary (30 registered types)

Commerce: hero, hero-slider, category-list, featured-categories, category-header, product-grid,
product-details, product-carousel, new-arrivals, best-sellers, related-products, recently-viewed.
Marketing: why-choose-us, brand-logos, coupons-strip, editorial-banner, flash-deals, rich-text,
ugc-gallery. Flow: cart, wishlist, search, auth, checkout, order-success, account-*, not-found.

## Commerce & interaction

- Add-to-cart, cart drawer (mini bag), full cart, checkout (coupons, shipping, submit), order success.
- Wishlist (shared state), Compare (theme-local, max 4, spec-table modal), Quick view (modal).
- Product detail: gallery, variants, quantity, breadcrumbs, share (Web Share + copy), reviews
  (aggregate score + per-star distribution + list with load-more), related rail.
- Category: client-side sort (price / name / rating) with a live result count.
- Search overlay + full search page (client-side filter over the shared product set — no invented API).
- FAQ accordion, newsletter capture, and static Blog / About / Contact pages.
- Toasts (polite `aria-live`) for add-to-cart / share feedback.

## Cross-cutting

- **Performance** — theme code-split (~16 kB JS / ~6 kB CSS gzip); images lazy + async-decoded with a
  fallback panel.
- **SEO** — driven by the shared `Seo` (React 19 native metadata) + schema helpers: title/description,
  OpenGraph, Twitter card, canonical, and Product + BreadcrumbList JSON-LD on the PDP.
- **Accessibility (WCAG 2.2 AA)** — landmarks (header/nav/main/footer), single h1 + ordered headings,
  labelled controls, alt text; Drawer/Modal are `role="dialog" aria-modal` with focus trap + restore,
  Escape, scroll-lock and a `[data-autofocus]` opt-in (shared skip link + RouteAnnouncer target
  `#sf-main`).
- **Motion** — `useReveal` scroll-reveal (fail-open: reveals on mount-in-view / scroll / reduced-motion
  / no-IO); all transitions collapse under `prefers-reduced-motion: reduce`.
- **RTL** — logical properties throughout; eyebrow letter-spacing + uppercasing neutralised under `[dir=rtl]`.

## Tests

`vitest run` — pure-logic coverage for `section-settings`, `section-data` (incl. reviews +
breadcrumbs readers), the compare-set transition (`toggleCompare`), and the product-grid `sortProducts`.
24 tests.

## Boundaries (do not cross)

Never import Theme 01 (`luxury-fashion/*`) or another theme. Never modify the engine
(`theme-engine/*`). Extend commerce only through the shared APIs (`api/storefront`) and shared state
(`state/*`) — no invented endpoints.
