import type { TrackingCommand } from './protocol';

type Call = (...args: unknown[]) => void;
interface QueuedCall extends Call { queue: unknown[][]; callMethod?: Call; handleRequest?: Call; loaded?: boolean; version?: string; push?: Call }
interface TikTokInstance extends Array<unknown> { track: Call; page: Call; _u?: string }
interface TikTokQueue extends Array<unknown> { instance: (id: string) => TikTokInstance; methods: string[]; setAndDefer: (target: unknown[], method: string) => void; _i: Record<string, TikTokInstance>; _t: Record<string, number>; _o: Record<string, unknown> }
interface AdvertisingWindow { fbq?: QueuedCall; _fbq?: QueuedCall; snaptr?: QueuedCall; ttq?: TikTokQueue; TikTokAnalyticsObject?: string; dataLayer?: unknown[]; gtag?: Call }
const initialized = new Set<string>(); const scripts = new Set<string>();
const sources = { facebook: 'https://connect.facebook.net/en_US/fbevents.js', snapchat: 'https://sc-static.net/scevent.min.js', tiktok: 'https://analytics.tiktok.com/i18n/pixel/events.js', google: 'https://www.googletagmanager.com/gtag/js' };
function load(src: string): void {
  if (scripts.has(src)) return;
  scripts.add(src); const script = document.createElement('script'); script.async = true; script.src = src; script.dataset.sellchazeTracking = '1';
  script.addEventListener('error', () => { scripts.delete(src); script.remove(); }, { once: true }); document.head.append(script);
}
function deferred(method: 'callMethod' | 'handleRequest'): QueuedCall {
  const call = ((...args: unknown[]) => { if (call[method]) call[method]!(...args); else call.queue.push(args); }) as QueuedCall;
  call.queue = []; return call;
}
export function sendTrackingCommand(command: TrackingCommand): void {
  // A scoped dev-only transport supports browser QA without emitting synthetic advertising data.
  if (import.meta.env.DEV && import.meta.env.VITE_TRACKING_TEST_MODE === '1') {
    console.info('[tracking-local-review]', JSON.stringify({ provider: command.provider, id: command.id, event: command.event, eventId: command.eventId, data: command.data })); return;
  }
  const host = window as Window & AdvertisingWindow; const key = `${command.provider}:${command.id}`;
  if (command.provider === 'facebook') {
    if (!host.fbq) { host.fbq = deferred('callMethod'); host.fbq.push = host.fbq; host.fbq.loaded = true; host.fbq.version = '2.0'; host._fbq = host.fbq; }
    if (!initialized.has(key)) { host.fbq('set', 'autoConfig', false, command.id); host.fbq('init', command.id); initialized.add(key); }
    load(sources.facebook); host.fbq('trackSingle', command.id, command.event, command.data, { eventID: command.eventId });
  } else if (command.provider === 'snapchat') {
    if (!host.snaptr) host.snaptr = deferred('handleRequest');
    if (!initialized.has(key)) { host.snaptr('init', command.id, {}); initialized.add(key); }
    load(sources.snapchat);
    // Official SDK supports track(pixelId,eventName,data); target only currently configured pixels.
    host.snaptr('track', command.id, command.event, command.data);
  } else if (command.provider === 'tiktok') {
    if (!host.ttq) {
      const queue = [] as unknown as TikTokQueue; queue._i = {}; queue._t = {}; queue._o = {};
      queue.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
      queue.setAndDefer = (target, method) => { (target as unknown as Record<string, unknown>)[method] = (...args: unknown[]) => target.push([method, ...args]); };
      queue.methods.forEach((method) => queue.setAndDefer(queue, method));
      queue.instance = (id) => queue._i[id]!; host.ttq = queue; host.TikTokAnalyticsObject = 'ttq';
    }
    if (!host.ttq._i[command.id]) {
      const instance = [] as unknown as TikTokInstance; instance._u = sources.tiktok;
      host.ttq.methods.forEach((method) => host.ttq!.setAndDefer(instance, method));
      host.ttq._i[command.id] = instance; host.ttq._t[command.id] = Date.now(); host.ttq._o[command.id] = {};
    }
    load(`${sources.tiktok}?sdkid=${encodeURIComponent(command.id)}&lib=ttq`);
    host.ttq.instance(command.id).track(command.event, command.data, { event_id: command.eventId });
  } else {
    host.dataLayer ??= [];
    // gtag.js consumes the IArguments queue documented in Google's bootstrap.
    // eslint-disable-next-line prefer-rest-params
    host.gtag ??= function (...args: unknown[]) { host.dataLayer!.push(arguments); void args; };
    if (!initialized.has(key)) { host.gtag('js', new Date()); host.gtag('config', command.id, { send_page_view: false }); initialized.add(key); }
    load(`${sources.google}?id=${encodeURIComponent(command.id)}`); host.gtag('event', command.event, command.data);
  }
}
