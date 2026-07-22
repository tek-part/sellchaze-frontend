import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

let instance = null;

/**
 * Lazily build a Laravel Echo instance wired to Pusher and the API's
 * JWT-protected broadcasting auth endpoint.
 */
export function getEcho() {
    if (instance) return instance;

    const key = import.meta.env.VITE_PUSHER_KEY;
    const cluster = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1';
    if (!key) return null;

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
}

export function resetEcho() {
    if (instance) {
        try { instance.disconnect(); } catch (e) { /* noop */ }
        instance = null;
    }
}
