let instance = null;
let pending = null;

/** Whether a real-time transport is configured for this build. */
export function realtimeConfigured() {
    return Boolean(import.meta.env.VITE_PUSHER_KEY);
}

/**
 * Lazily build a Laravel Echo instance wired to Pusher and the API's JWT-protected broadcasting
 * auth endpoint. laravel-echo and pusher-js are imported on first use, so they stay out of the app
 * shell's chunk; resolves to `null` when real-time is not configured or cannot be loaded (callers
 * fall back to polling).
 */
export function loadEcho() {
    if (instance) return Promise.resolve(instance);
    if (!realtimeConfigured()) return Promise.resolve(null);
    pending ??= Promise.all([import('laravel-echo'), import('pusher-js')])
        .then(([{ default: Echo }, { default: Pusher }]) => {
            if (instance) return instance;
            const key = import.meta.env.VITE_PUSHER_KEY;
            const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';

            window.Pusher = Pusher;

            const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
            const authBase = apiUrl.replace(/\/v1\/?$/, '');
            const token = localStorage.getItem('sellchase_access_token');

            instance = new Echo({
                broadcaster: 'pusher',
                key,
                cluster,
                forceTLS: true,
                authEndpoint: `${authBase}/broadcasting/auth`,
                auth: {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                        Accept: 'application/json',
                    },
                },
            });
            return instance;
        })
        .catch(() => null)
        .finally(() => { pending = null; });
    return pending;
}

export function resetEcho() {
    if (instance) {
        try { instance.disconnect(); } catch { /* noop */ }
        instance = null;
    }
}
