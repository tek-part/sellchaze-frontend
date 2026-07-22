/**
 * Token → CSS custom property projection.
 *
 * Flattens a `DesignTokens` set (for one resolved colour scheme) into `--token` custom
 * properties matching the documented names 1:1 (docs/themes/…/02-design-tokens), and applies
 * them to a DOM element. Components/sections/pages reference ONLY `var(--token)`, so a theme
 * (or scheme) swap is a single property write — never markup surgery. Breakpoints are NOT
 * emitted (CSS media queries can't read custom properties).
 */
import type { ColorScheme, DesignTokens } from './types';

const SPACE_INDEX: Record<string, string> = {
  sp0: '0', sp1: '1', sp2: '2', sp3: '3', sp4: '4', sp5: '5', sp6: '6',
  sp7: '7', sp8: '8', sp9: '9', sp10: '10', sp11: '11', sp12: '12',
};

/** Flatten tokens for `scheme` into a map of `--name` → value. Deterministic + pure. */
export function flattenTokens(
  tokens: DesignTokens,
  scheme: ColorScheme,
): Readonly<Record<string, string>> {
  const vars: Record<string, string> = {};
  const c = tokens.color[scheme];

  // colour
  vars['--primary'] = c.primary;
  vars['--on-primary'] = c.onPrimary;
  vars['--accent'] = c.accent;
  vars['--accent-ink'] = c.accentInk;
  vars['--bg'] = c.bg;
  vars['--surface'] = c.surface;
  vars['--surface-2'] = c.surface2;
  vars['--text'] = c.text;
  vars['--muted'] = c.muted;
  vars['--border'] = c.border;
  vars['--border-strong'] = c.borderStrong;
  vars['--sale'] = c.sale;
  vars['--success'] = c.success;
  vars['--danger'] = c.danger;
  vars['--warning'] = c.warning;
  vars['--info'] = c.info;
  vars['--scrim'] = c.scrim;
  vars['--scrim-soft'] = c.scrimSoft;

  // typography
  const t = tokens.typography;
  vars['--font'] = t.fontSans;
  vars['--heading'] = t.fontSerif;
  vars['--font-mono'] = t.fontMono;
  vars['--font-ar'] = t.fontArabic;
  for (const [step, value] of Object.entries(t.fontSize)) vars[`--fs-${step}`] = value;
  vars['--lh'] = t.lineHeight;
  vars['--lh-tight'] = t.lineHeightTight;
  vars['--tracking-eyebrow'] = t.trackingEyebrow;
  vars['--tracking-caps'] = t.trackingCaps;

  // spacing
  const s = tokens.spacing;
  for (const [key, value] of Object.entries(s.scale)) {
    const idx = SPACE_INDEX[key];
    if (idx !== undefined) vars[`--sp-${idx}`] = value;
  }
  vars['--section-y'] = s.sectionY;
  vars['--gutter'] = s.gutter;
  vars['--grid-gap'] = s.gridGap;
  vars['--stack'] = s.stack;
  vars['--container'] = s.container;
  vars['--container-narrow'] = s.containerNarrow;
  vars['--tap'] = s.tap;

  // radius
  vars['--radius-sm'] = tokens.radius.sm;
  vars['--radius'] = tokens.radius.base;
  vars['--radius-lg'] = tokens.radius.lg;
  vars['--radius-pill'] = tokens.radius.pill;

  // shadow
  vars['--shadow-sm'] = tokens.shadow.sm;
  vars['--shadow'] = tokens.shadow.base;
  vars['--shadow-lg'] = tokens.shadow.lg;
  vars['--shadow-focus'] = tokens.shadow.focus;
  vars['--shadow-inset'] = tokens.shadow.inset;

  // motion
  vars['--ease'] = tokens.motion.ease;
  vars['--ease-in-out'] = tokens.motion.easeInOut;
  vars['--ease-emphasis'] = tokens.motion.easeEmphasis;
  vars['--transition'] = tokens.motion.transition;
  vars['--transition-slow'] = tokens.motion.transitionSlow;
  vars['--transition-fast'] = tokens.motion.transitionFast;

  // sizing
  vars['--icon-sm'] = tokens.size.iconSm;
  vars['--icon-md'] = tokens.size.iconMd;
  vars['--icon-lg'] = tokens.size.iconLg;

  // z-index
  vars['--z-base'] = String(tokens.zIndex.base);
  vars['--z-sticky'] = String(tokens.zIndex.sticky);
  vars['--z-header'] = String(tokens.zIndex.header);
  vars['--z-dropdown'] = String(tokens.zIndex.dropdown);
  vars['--z-overlay'] = String(tokens.zIndex.overlay);
  vars['--z-drawer'] = String(tokens.zIndex.drawer);
  vars['--z-modal'] = String(tokens.zIndex.modal);
  vars['--z-toast'] = String(tokens.zIndex.toast);

  return vars;
}

/** Apply flattened tokens to an element's inline custom properties (idempotent). */
export function applyTokensToElement(
  element: HTMLElement,
  tokens: DesignTokens,
  scheme: ColorScheme,
): void {
  const vars = flattenTokens(tokens, scheme);
  for (const [name, value] of Object.entries(vars)) {
    element.style.setProperty(name, value);
  }
  element.dataset['theme'] = scheme;
  element.style.colorScheme = scheme;
}
