// Customer directory keys (normalized phone, lower-cased email, or `order:<id>`) travel in the
// `?key=` query string of the customer page, so `+` and `@` must be encoded.

/** A hand-typed `?key=+2010…` arrives with the plus decoded as a space. */
export const readCustomerKey = (raw) => (raw ?? '').replace(/^ (?=\d)/, '+').trim();

export const customerHref = (uiBase, key) => `${uiBase}/customers/view?key=${encodeURIComponent(key)}`;

/** Split on commas, collapse spaces, drop case-insensitive duplicates (the API applies the same rules). */
export function mergeTags(current, input) {
    const next = [...current];
    for (const piece of String(input).split(',')) {
        const tag = piece.replace(/\s+/g, ' ').trim();
        if (tag && !next.some((item) => item.toLowerCase() === tag.toLowerCase())) next.push(tag);
    }
    return next;
}
