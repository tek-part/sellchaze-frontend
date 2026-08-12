/**
 * Does `pathname` sit inside the navigation section rooted at `prefix`?
 *
 * The primary header links point at an entry page rather than the section root
 * (Orders links to `/orders/in`), so highlighting cannot be a plain equality
 * check. It has to match the section root and everything nested under it —
 * without matching a sibling that merely starts with the same characters
 * (`/products` must not light up on `/products-import`).
 */
export function isSection(pathname: string | undefined | null, prefix: string): boolean {
    if (typeof pathname !== 'string' || typeof prefix !== 'string' || prefix === '') return false;
    const path = pathname.replace(/\/+$/, '') || '/';
    const root = prefix.replace(/\/+$/, '') || '/';
    if (root === '/') return path === '/';
    return path === root || path.startsWith(`${root}/`);
}

/** True when `pathname` belongs to any of the given section roots. */
export function isAnySection(pathname: string | undefined | null, prefixes: readonly string[]): boolean {
    return prefixes.some((prefix) => isSection(pathname, prefix));
}
