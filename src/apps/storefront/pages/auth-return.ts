/** Limit customer auth returns to public product or checkout routes, on this storefront. */
export function customerAuthReturn(search: string): string {
  const next = new URLSearchParams(search).get('next');
  if (!next || !next.startsWith('/') || [...next].some(character => character === '\\' || character.charCodeAt(0) <= 32) || next.startsWith('//')) return '/account';
  const target = new URL(next, 'https://store.invalid');
  if (target.origin !== 'https://store.invalid' || !/^\/(?:products\/[a-zA-Z0-9-]+|checkout)\/?$/.test(target.pathname)) return '/account';
  return `${target.pathname}${target.search}${target.hash}`;
}

/** Keep a validated return when switching between customer sign-in and registration. */
export function customerAuthLink(path: '/login' | '/register', search: string): string {
  const next = customerAuthReturn(search);
  return next === '/account' ? path : `${path}?next=${encodeURIComponent(next)}`;
}
