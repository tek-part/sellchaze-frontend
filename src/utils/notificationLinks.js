import { merchantWorkspaceRouteAllowed } from '../lib/merchantWorkspaceRoutes';

/** Notification destinations must resolve to an actual workspace route. */
export function notificationDestination(link, origin, merchant = true) {
    if (typeof link !== 'string' || !link.trim()) return null;
    try {
        const url = new URL(link.trim(), origin);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password) return null;
        if (merchant && !merchantWorkspaceRouteAllowed(url.pathname)) return null;
        return `${url.pathname}${url.search}${url.hash}`;
    } catch { return null; }
}
