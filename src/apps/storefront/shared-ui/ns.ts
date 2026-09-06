/**
 * Shared-UI namespacing.
 *
 * This package holds ONE implementation of each primitive's behaviour (keyboard handling, ARIA
 * wiring, range collapsing, focus order) while leaving every visual decision to the stylesheet.
 *
 * The mechanism is a class namespace. A shared component emits `${ns}-pagination`, `${ns}-page`,
 * `${ns}-page--current`; the foundation skin (`foundation/base.css`) styles the `sf` namespace and
 * every theme reskins those classes in its own `shared.css`, so themes stay visually distinct —
 * sharing logic never means sharing looks. The retired legacy themes each had their own namespace;
 * the five library-based themes all render `sf`, so that is the only member today. A theme that
 * needs a fully separate skin can add its namespace here and style it in its own stylesheet.
 *
 * `ns` defaults to `sf` so the shared page layer keeps its existing class contract with no churn.
 */
export type ClassNamespace = 'sf';

export const DEFAULT_NS: ClassNamespace = 'sf';

/** Build a namespaced BEM class: `block('pagination', 'sf')` → `sf-pagination`. */
export function block(name: string, ns: ClassNamespace = DEFAULT_NS): string {
  return `${ns}-${name}`;
}

/** Build a namespaced BEM modifier: `mod('page', 'current', 'sf')` → `sf-page--current`. */
export function mod(name: string, modifier: string, ns: ClassNamespace = DEFAULT_NS): string {
  return `${ns}-${name}--${modifier}`;
}

/** Build a namespaced BEM element: `el('state', 'title', 'sf')` → `sf-state__title`. */
export function el(name: string, element: string, ns: ClassNamespace = DEFAULT_NS): string {
  return `${ns}-${name}__${element}`;
}
