/** A preview capability is only forwarded; signature, expiry and store scope stay server-verified. */
export function readSignedPreviewToken(search: string): string | null {
  const token = new URLSearchParams(search).get('__preview');
  return token && /^[A-Za-z0-9_-]{1,256}\.[a-f0-9]{64}$/i.test(token) ? token : null;
}

export function withPreviewRead(path: string, method: string, search: string): string {
  const token = readSignedPreviewToken(search);
  if (!token || method.toUpperCase() !== 'GET' || !path.startsWith('/') || path.startsWith('//')) return path;
  const url = new URL(path, 'https://storefront.invalid');
  // Theme/layout reads need the capability. Orders, checkout, auth, uploads and
  // payment operations never receive it through this transport.
  if (!/^\/(?:$|context\/?$|layout(?:\/|$)|pages\/|funnels\/)/.test(url.pathname) || url.searchParams.has('__preview')) return path;
  url.searchParams.set('__preview', token);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function withPreviewLink(href: string, current: string, token: string): string | null {
  if (!href || href.startsWith('#') || !readSignedPreviewToken(`__preview=${encodeURIComponent(token)}`)) return null;
  let target: URL; let base: URL;
  try { base = new URL(current); target = new URL(href, base); } catch { return null; }
  if (!/^https?:$/.test(target.protocol) || target.origin !== base.origin) return null;
  if (/^\/(?:api|storage|assets|media|fonts)(?:\/|$)/.test(target.pathname)) return null;
  // Do not modify independently signed URLs or a different explicit preview.
  if (target.searchParams.has('signature') || target.searchParams.has('payment_token') || target.searchParams.has('receipt_token')) return null;
  if (target.searchParams.has('__preview') && target.searchParams.get('__preview') !== token) return null;
  target.searchParams.set('__preview', token);
  return `${target.pathname}${target.search}${target.hash}`;
}

export function publicStorefrontUrl(href: string): string {
  try { const url = new URL(href); url.searchParams.delete('__preview'); return url.href; } catch { return href; }
}

/** Full-document navigation used by the shared search overlays. */
export function preservePreviewNavigation(href: string): string {
  if (typeof window === 'undefined') return href;
  const token = readSignedPreviewToken(window.location.search);
  return token ? withPreviewLink(href, window.location.href, token) ?? href : href;
}
