/**
 * `?redirect=` after sign-in or sign-up must stay inside the dashboard: only same-app paths are
 * accepted, so a crafted link cannot bounce a freshly signed-in user to another site.
 */
export function safeRedirect(value, fallback = '/dashboard') {
    if (typeof value !== 'string' || !value.startsWith('/')) return fallback;
    // "//host" and "/\host" are protocol-relative URLs in browsers.
    if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
    // Control characters (tabs, newlines) are stripped by URL parsers and can hide a host.
    if ([...value].some((char) => char.charCodeAt(0) < 0x20)) return fallback;
    return value;
}
