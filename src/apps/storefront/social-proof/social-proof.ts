/** Pure helpers for the sales-notification widget. The server already anonymises every event. */
export type SocialProofPage = 'home' | 'product' | 'collection' | 'cart';
export interface SocialProofEvent {
  initial: string | null;
  city: string | null;
  minutes_ago: number | null;
  product: { id: number; name: string; slug: string; image_url: string | null };
}
export interface SocialProofFeed {
  version: number;
  first_delay_seconds: number;
  interval_seconds: number;
  display_seconds: number;
  position: 'bottom-start' | 'bottom-end';
  pages: Partial<Record<SocialProofPage, boolean>>;
  events: ReadonlyArray<SocialProofEvent>;
}

/** Checkout and account pages never show notifications. */
export function socialProofPage(path: string): SocialProofPage | null {
  if (path === '/') return 'home';
  if (path === '/cart') return 'cart';
  if (/^\/products\/[^/]+\/?$/.test(path)) return 'product';
  if (path === '/shop' || path === '/search' || path === '/collections' || /^\/(collections|categories|brands)\/[^/]+\/?$/.test(path)) return 'collection';
  return null;
}

export function socialProofAllowed(feed: Pick<SocialProofFeed, 'pages'>, path: string): boolean {
  const page = socialProofPage(path);
  return page !== null && feed.pages[page] === true;
}

export function socialProofWho(event: Pick<SocialProofEvent, 'initial' | 'city'>, locale: string): string {
  const ar = locale === 'ar';
  const initial = event.initial ? `${event.initial}.` : '';
  if (initial && event.city) return ar ? `${initial} من ${event.city}` : `${initial} in ${event.city}`;
  if (initial) return initial;
  if (event.city) return ar ? `شخص من ${event.city}` : `Someone in ${event.city}`;
  return ar ? 'شخص' : 'Someone';
}

export function socialProofAction(locale: string): string {
  return locale === 'ar' ? 'اشترى' : 'bought';
}

export function socialProofTime(minutes: number | null, locale: string): string {
  if (minutes === null || !Number.isFinite(minutes)) return '';
  const format = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  if (minutes < 60) return format.format(-Math.max(1, Math.round(minutes)), 'minute');
  if (minutes < 1440) return format.format(-Math.round(minutes / 60), 'hour');
  return format.format(-Math.round(minutes / 1440), 'day');
}

export function socialProofSentence(event: SocialProofEvent, locale: string): string {
  return [socialProofWho(event, locale), socialProofAction(locale), event.product.name].join(' ');
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const memory = new Set<string>();
const dismissKey = (storeId: string): string => `sf:social-proof:${encodeURIComponent(storeId)}:dismissed`;
function session(): StorageLike | undefined { try { return window.sessionStorage; } catch { return undefined; } }
export function socialProofDismissed(storeId: string, target: StorageLike | undefined = session()): boolean {
  if (memory.has(storeId)) return true;
  try { return target?.getItem(dismissKey(storeId)) === '1'; } catch { return false; }
}
export function dismissSocialProof(storeId: string, target: StorageLike | undefined = session()): void {
  memory.add(storeId);
  try { target?.setItem(dismissKey(storeId), '1'); } catch { /* the in-memory flag still hides it for this page view */ }
}
