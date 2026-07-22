# Theme 04 — Rouge · Luminous Beauty

A fully independent storefront theme: a light-first, editorial **luxury beauty & cosmetics** language —
porcelain lit from within, a confident **rouge** primary with **gilded-rose** flourishes, a high-contrast
didone display serif over a warm humanist sans, pillowy 16/24px pill radii, soft **rose-bloom** elevation,
a luminous focus glow, and a velvet-aubergine **"Boudoir"** dark mode. Rouge shares **only** the frozen
theme engine, the registries/renderer, the storefront data contract, the shared state (cart/wishlist/
recently-viewed), and the shared APIs. It reuses **no** other theme's markup or styling — its own `.rge-*`
namespace throughout, plus a Rouge re-skin of the shared `.sf-*` surface for the transactional pages.

## Activate

```
/storefront.html?theme=rouge&scheme=light   (default)
/storefront.html?theme=rouge&scheme=dark    (Boudoir)
```

Registered via the platform catalog; loads as a lazy chunk, so only the active theme's JS+CSS load.

## Structure

```
rouge/
  manifest.ts         id, name, colour schemes, capabilities (rtl, dark-mode)
  settings.ts         merchant settings (scheme, primary/accent/sale, glow, shade dots, free-ship, width)
  tokens.ts           DesignTokens (light default + Boudoir dark maps, type, spacing, radius, shadow, motion)
  index.ts            ThemeModule: manifest + tokens + createTokens + sections + layouts + templates
  theme.css           design system + component skin (.rge-* base, buttons, cards, gallery, reviews, toast…)
  sections.css        section layouts (hero, PDP, rails, marketing sections, countdown)
  chrome.css          header / nav / footer / mobile / cart drawer / search overlay
  shared.css          Rouge re-skin of the shared .sf-* surface (cart/checkout/account/auth/search/blog/404)
  components/          40+ own components + overlay hooks (Portal, Drawer, useFocusTrap/ScrollLock) + toast/
  sections/           18 section components + section-settings/section-data readers (+ tests)
  chrome/             Header, Footer, AnnouncementBar, CartDrawer, SearchOverlay
  layouts/            DefaultLayout (global chrome + drawers + toast provider)
```

## Page coverage

**Bespoke `.rge-*` templates:** Home · Category (category-header + grid) · Product (PDP: gallery, shade
picker, variant pills, buy box + add-to-bag toast, tabbed details, reviews, related, recently-viewed).

**Shared pages, Rouge-skinned via `shared.css`** (they render the default `.sf-*` component library and
fall back to it when the theme provides no template — exactly as Theme 01 works): Cart · Checkout · Order
success · Wishlist · Search · Login / Register / Forgot / Reset password · Account (Profile / Orders /
Order detail / Addresses) · About · Contact · FAQ · Blog · 404.

## Sections (18 types)

hero · hero-slider · category-header · category-list/featured-categories · product-grid · product-details ·
product-carousel · new-arrivals · best-sellers/bestsellers-by-shade · related-products · recently-viewed ·
flash-deals/limited-drop · editorial-banner · collection/lookbook · brand-logos · instagram/ugc-gallery ·
coupons-strip · faq · values/why-choose-us · rich-text · shade-finder · clean-standards · testimonials ·
newsletter. Unknown types are dropped by the engine; every section is settings-driven + self-hiding.

## Signature elements

- **ShadeDots** — the cosmetic-first control: circular shade swatches with a double-ring selected state
  (product cards preview; PDP is interactive).
- **Shade Finder** + **Clean Standards** — beauty merchandising sections.
- **Aura glow**, **gilt** eyebrow rules + underlines, **bloom** shadows, **Countdown**, add-to-bag toast.

## Accessibility & motion

- Visible rouge focus glow (never removed); `aria-*` on all controls; 44px tap targets; RTL via logical
  properties; drawers trap focus, lock scroll, and close on Escape/scrim.
- "Bloom" scroll-reveal + gilt shimmer + ken-burns hero; **all** motion degrades to instant under
  `prefers-reduced-motion`. Images lazy/async-decoded with a porcelain fallback; CLS-safe skeletons.

## Validation

```
npx tsc -p tsconfig.storefront.json --noEmit    # 0
npx eslint src/apps/storefront/themes/rouge      # 0
npx vitest run src/apps/storefront/themes/rouge  # section-settings + section-data suites
npx vite build                                   # code-split rouge chunk
```
