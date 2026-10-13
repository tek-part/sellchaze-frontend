export function pushSupported() {
    return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
export function publicKeyBytes(value) {
    return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (character) => character.charCodeAt(0));
}
export async function deviceSubscription() {
    if (!pushSupported()) return null;
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration?.active?.scriptURL.endsWith('/merchant-order-push-sw.js')) return null;
    return registration.pushManager.getSubscription();
}
export async function endpointHash(subscription) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(subscription.endpoint));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export async function enableDevicePush(publicKey) {
    // Only called by the explicit Save action; never prompt while loading a page.
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('PUSH_PERMISSION');
    const registration = await navigator.serviceWorker.register('/merchant-order-push-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    const worker = registration.installing || registration.waiting;
    if (worker && worker.state !== 'activated') await new Promise((resolve, reject) => {
        const changed = () => {
            if (worker.state === 'activated' || worker.state === 'redundant') {
                worker.removeEventListener('statechange', changed);
                if (worker.state === 'activated') resolve(); else reject(new Error('PUSH_RENEW'));
            }
        };
        worker.addEventListener('statechange', changed); changed();
    });
    const key = publicKeyBytes(publicKey);
    let subscription = await registration.pushManager.getSubscription();
    const oldKey = subscription?.options.applicationServerKey;
    if (subscription && (!oldKey || Array.from(new Uint8Array(oldKey)).join(',') !== Array.from(key).join(','))) {
        if (!await subscription.unsubscribe()) throw new Error('PUSH_RENEW');
        subscription = null;
    }
    return subscription || registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}
