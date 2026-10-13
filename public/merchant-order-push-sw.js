/* Merchant notifications only: no fetch interception or private-page caching. */
self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('push', (event) => {
    let data;
    try { data = event.data?.json(); } catch { return; }
    if (!data || typeof data.tag !== 'string' || !/^sellchaze-order-[a-f0-9-]{36}$/.test(data.tag)) return;
    event.waitUntil(self.registration.showNotification('طلب جديد', {
        body: 'لديك طلب جديد في متجرك.', tag: data.tag, renotify: false,
        data: { url: '/store/orders' },
    }));
});
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = new URL('/store/orders', self.location.origin).href;
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
        const client = clients.find((candidate) => new URL(candidate.url).origin === self.location.origin);
        if (client) { await client.navigate(url); return client.focus(); }
        return self.clients.openWindow(url);
    }));
});
