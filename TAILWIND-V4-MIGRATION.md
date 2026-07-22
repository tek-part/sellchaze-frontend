# Tailwind v3 → v4 Migration — Audit & Plan (frontend)

> **Audit + plan only. No code changed yet** (per directive). Goal: a production-grade Tailwind
> **v4** migration of the single Vite app (admin/merchant/supplier dashboards + storefront) with
> **zero visual regressions**, zero TS errors, zero ESLint errors, green production build. React 19
> is already done (S1). This is **S2**.

## 0. Scope facts
- One CSS entry: `src/index.css`. One config: `tailwind.config.js` (JS). PostCSS: `postcss.config.js`.
- **No custom Tailwind plugins** (`plugins: []`). **No `dark:` variants** (dashboards are light-only).
- **No** removed `*-opacity`, `flex-shrink/grow`, `overflow-ellipsis`, `decoration-slice`.
- **No** CSS-var-shorthand arbitrary values (`bg-[--x]`) → nothing to convert there.

## 1. Audit report

### 1a. Renamed utilities (values differ in v4 → must update to keep parity)
| v3 class | uses (.jsx) | v4 equivalent |
|---|---|---|
| `shadow-sm` | **232** | `shadow-xs` |
| `shadow` (bare) | 10 | `shadow-sm` |
| `rounded` (bare) | 42 | `rounded-sm` |
| `rounded-sm` | 3 | `rounded-xs` |
| `outline-none` | 94 | `outline-hidden` |
| `ring` (bare) | 44 | width 3px→1px in v4 → needs `ring-3` for parity |
| `shadow-md/lg/xl` | 15/20/12 | unchanged names (values equal) — **no change** |

### 1b. Removed / changed defaults
| Item | uses | Change |
|---|---|---|
| bare `border` | **850** | default border-color gray-200 → `currentColor` (v4). Must restore default color or borders change. |
| `!important` **prefix** `!class` | ~225 candidates* | v4 moved important to **suffix** `class!`. Prefix form no longer applies. |

*`~225` is a grep upper bound including JS negations (`!isOpen`); the codemod counts only class-string occurrences.

### 1c. Arbitrary values
- **413** arbitrary values (`w-[42px]`, `bg-[#fff]`, `top-[3px]`…). These compile identically in v4.
  Only the **CSS-variable shorthand** changed (`bg-[--v]` → `bg-(--v)`), and we have **0** of those. → **no change**.

### 1d. Custom plugins → none.

### 1e. `@layer` usage — `src/index.css` has one `@layer base { … }` (html/body/#root resets, `table th{text-align:start}`). v4 still supports `@layer`; keep as-is (verify).

### 1f. `@apply` usage — 1 real: `body { @apply text-slate-800 antialiased; }`. v4 supports `@apply` (both utilities still exist). Keep.

### 1g. `theme()` function calls (v4 prefers CSS vars)
- `background-color: theme('colors.surface.DEFAULT')` (body)
- `color: theme('colors.brand.DEFAULT')` (`.sc-caret::after`)
→ v4: `var(--color-surface)` / `var(--color-brand)`.

### 1h. Custom CSS dependencies
- Google Fonts `@import url(…)` (top of index.css) — keep, must stay **before** `@import "tailwindcss"`.
- `react-quill-new/dist/quill.snow.css` (imported in JS) — unaffected.
- Custom keyframes/animations (`sc-*`) + reduced-motion block — plain CSS, unaffected.

### 1i. PostCSS dependencies (`postcss.config.js`)
- `tailwindcss: {}` → **`@tailwindcss/postcss: {}`** (v4 plugin moved to its own package).
- `autoprefixer: {}` → **remove** (vendor-prefixing is built into v4). Keep `postcss` (peer).
- (Alternative: `@tailwindcss/vite` plugin + delete postcss tailwind entry — faster; decision below.)

### 1j. Build configuration dependencies (`vite.config.js`)
- Uses `@vitejs/plugin-react` + `manualChunks` (vendor-editor/motion/charts/react). **No Tailwind coupling today.**
- Migration touches vite config only if we choose the `@tailwindcss/vite` plugin (recommended).
- `tailwind.config.js` (JS theme) → port to CSS `@theme` (see plan S2.2). `content` globs → v4 auto-detects; drop.

### 1k. `tailwind.config.js` theme to port → `@theme`
```
colors.brand   { DEFAULT #004BB4, dark #003A8F, light #E8EEF9 }
colors.accent  { DEFAULT #00C0A9, dark #009E8C, light #E6FAF7 }
colors.surface { DEFAULT #f6f8fc, card #ffffff, muted #f0f4fa }
fontFamily.sans   = 'IBM Plex Sans', system-ui, sans-serif
fontFamily.arabic = 'IBM Plex Sans Arabic','IBM Plex Sans', system-ui, sans-serif
boxShadow.soft = 0 4px 24px -4px rgba(0,75,180,.08), 0 2px 8px -2px rgba(15,23,42,.06)
boxShadow.card = 0 1px 3px rgba(0,75,180,.06), 0 4px 16px -4px rgba(15,23,42,.05)
```
→ `--color-brand`, `--color-brand-dark/-light`, `--color-accent*`, `--color-surface`, `--color-surface-card/-muted`, `--font-sans`, `--font-arabic`, `--shadow-soft`, `--shadow-card`. Utilities `bg-brand`, `text-accent`, `bg-surface-card`, `font-arabic`, `shadow-soft`, `shadow-card` keep working.

## 2. Migration plan (per incompatibility)

| # | Issue | v4 equivalent | Risk | Validation |
|---|---|---|---|---|
| P1 | PostCSS plugin + autoprefixer | `@tailwindcss/vite` plugin (or `@tailwindcss/postcss`); drop autoprefixer | Low | build compiles CSS |
| P2 | `@tailwind` directives | `@import "tailwindcss";` (fonts `@import` stays first) | Low | build; utilities present |
| P3 | JS config theme | `@theme` block in index.css (colors/fonts/shadows above); delete `tailwind.config.js`, drop `content` | **Med** — custom `bg-brand`/`font-arabic`/`shadow-soft` must resolve | visual: brand colors, arabic font, soft/card shadows |
| P4 | `theme()` calls (2) | `var(--color-surface)` / `var(--color-brand)` | Low | body bg + caret color unchanged |
| P5 | bare `border` default color (850) | restore default: base rule setting border-color to `--color-gray-200` (Tailwind's own documented upgrade step — not a hack) | **Med** | visual: every bordered card/table/input |
| P6 | renamed utils `shadow-sm/shadow/rounded/rounded-sm/outline-none` | mechanical rename to v4 names (§1a) | **Med** (volume) | visual: shadows, radii, focus outlines |
| P7 | bare `ring` (44) width 3px→1px | `ring-3` for parity | Med | visual: focus rings |
| P8 | `!important` prefix (~N) | `!class` → `class!` | Med | visual: forced styles still applied |

**Mechanism:** run the official codemod `npx @tailwindcss/upgrade` (it performs P1, P2, P3-as-`@theme` or `@config`, P5 border base, P6/P7/P8 class renames precisely inside class strings — it parses JSX, so JS negations are NOT touched). Then **manual review of the diff** + fix anything the codemod misses. This is a *real v4 migration*, not shims. `@config`/compat hacks avoided unless a specific case is truly unavoidable (only P5's border-default base rule, which is Tailwind-sanctioned).

## 3. Incremental commit plan (validate after EACH: `tsc` storefront · `eslint .` (0 errors) · `vite build` · **visual parity** · dashboard smoke)
- **S2.1** Tooling: install `tailwindcss@4` + `@tailwindcss/vite`; remove `autoprefixer`; wire vite plugin; delete postcss tailwind entry. *(no class changes yet — build must still pass with v3-syntax CSS? No — needs S2.2 together.)* → combined with S2.2.
- **S2.2** CSS entry + theme: `@import "tailwindcss"` + `@theme` (ported config) + `theme()`→`var()` + border-default base. Delete `tailwind.config.js`. Build + full visual parity of one reference screen.
- **S2.3** Class renames (codemod output), reviewed: shadows/rounded/outline/ring/important. Commit in logical chunks if the diff is large (e.g., by folder). Visual parity per dashboard.
- **S2.4** Cleanup: remove `.npmrc` legacy flag if no longer needed; remove dead config; final full validation.

## 4. Visual-parity protocol (any deviation = bug)
**Before** each step: capture reference screenshots of representative screens per dashboard —
Admin, Merchant, Supplier — in the running app (login + one data-dense page each), light theme, **LTR and RTL**.
**After**: compare **spacing · typography · colors · borders · shadows · hover states · focus states ·
responsive layouts (sm/md/lg/xl) · RTL · dark mode (n/a — none present)**. Diff visually; fix to identical.

> **Constraint:** interactive dashboard pages need login. Parity verification of authed screens requires
> test credentials or a seeded session. Public/landing + login screens can be verified now; authed
> dashboards need a login to screenshot — **flagging this as a prerequisite** for full parity sign-off.

## 5. Definition of done (S2)
React 19 ✓ + **Tailwind v4** · TypeScript · one Vite app · **0 visual regressions** · 0 TS errors ·
0 ESLint errors · green production build · dashboards visually identical (LTR+RTL). Storefront never
drove any dashboard change.

---
*Awaiting approval of this plan before making any code change (per directive).*
