/**
 * Shared-UI namespacing.
 *
 * The storefront had four independent copies of the same primitives — Theme 01 built all of them,
 * Themes 02–04 rebuilt a subset each and simply went without the rest. This package holds ONE
 * implementation of the behaviour (keyboard handling, ARIA wiring, range collapsing, focus order)
 * while leaving every visual decision to the theme.
 *
 * The mechanism is a class namespace. A shared component emits `${ns}-pagination`, `${ns}-page`,
 * `${ns}-page--current`; Theme 01 passes `sf`, Voltage `vlt`, Hearth `hh`, Rouge `rge`. Each theme
 * then styles those classes in its own stylesheet, so themes stay visually distinct — sharing logic
 * never means sharing looks.
 *
 * `ns` defaults to `sf` so Theme 01 and the shared page layer keep their existing class contract
 * with no churn.
 */
export type ClassNamespace = 'sf' | 'vlt' | 'hh' | 'rge';

export const DEFAULT_NS: ClassNamespace = 'sf';

/** Build a namespaced BEM class: `block('pagination', 'vlt')` → `vlt-pagination`. */
export function block(name: string, ns: ClassNamespace = DEFAULT_NS): string {
  return `${ns}-${name}`;
}

/** Build a namespaced BEM modifier: `mod('page', 'current', 'vlt')` → `vlt-page--current`. */
export function mod(name: string, modifier: string, ns: ClassNamespace = DEFAULT_NS): string {
  return `${ns}-${name}--${modifier}`;
}

/** Build a namespaced BEM element: `el('state', 'title', 'hh')` → `hh-state__title`. */
export function el(name: string, element: string, ns: ClassNamespace = DEFAULT_NS): string {
  return `${ns}-${name}__${element}`;
}
