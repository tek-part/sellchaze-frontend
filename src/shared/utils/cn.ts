/**
 * `cn` — a tiny, dependency-free className combiner.
 *
 * Accepts strings, falsy values (dropped), and `{ [class]: boolean }` maps, and joins the truthy
 * class names with single spaces. Deliberately does NOT resolve Tailwind conflicts (no tailwind-
 * merge); components are authored so the last-wins order is intentional. Pure + allocation-light.
 */
export type ClassValue = string | number | false | null | undefined | Record<string, boolean>;

export function cn(...values: ReadonlyArray<ClassValue>): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
      continue;
    }
    for (const key in value) {
      if (value[key]) out.push(key);
    }
  }
  return out.join(' ');
}
