/** Keep previews on their proxy; the deployed merchant UI uses the separate API host. */
export function resolveApiBase({ configured, protocol, hostname, development }) {
    if (configured && String(configured).trim() !== '') {
        let url = String(configured).trim().replace(/\/$/, '');
        if (protocol === 'https:' && /^http:\/\//i.test(url)) url = url.replace(/^http:\/\//i, 'https://');
        return url;
    }
    if (!development && ['app.sellchaze.com', 'sellchaze.com', 'www.sellchaze.com'].includes(hostname?.toLowerCase())) {
        return 'https://api.sellchaze.com/api/v1';
    }
    return '/api/v1';
}
