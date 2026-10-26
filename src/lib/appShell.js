/**
 * The signed-in shell (sidebar, header, notifications, realtime chat badge) is a route chunk, so
 * the login page — the first view for a signed-out visitor — ships only what it renders. App.jsx
 * lazy-renders it; main.jsx calls `preloadAppLayout()` at boot when a session token exists, so a
 * signed-in visit fetches the shell in parallel with the translations instead of after them.
 */
export const loadAppLayout = () => import('../components/AppLayout');

export function preloadAppLayout() {
    return loadAppLayout().catch(() => undefined);
}
