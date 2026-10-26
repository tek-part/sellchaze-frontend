import { useEffect, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { StoreInfo } from '../state/store-context';
import { dismissSocialProof, socialProofAction, socialProofAllowed, socialProofDismissed, socialProofTime, socialProofWho, type SocialProofEvent, type SocialProofFeed } from './social-proof';
import './social-proof.css';

/** Sales notifications from the store's own recent orders. Lazy-loaded; never shown at checkout. */
export default function SocialProof({ store, apiOk, locale }: { store: StoreInfo; apiOk: boolean; locale: string }): ReactElement | null {
  const ar = locale === 'ar';
  const { pathname } = useLocation();
  const [feed, setFeed] = useState<SocialProofFeed | null>(null);
  const [current, setCurrent] = useState<SocialProofEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => socialProofDismissed(store.id));
  useEffect(() => {
    if (!apiOk || dismissed) return;
    const abort = new AbortController();
    apiFetch<{ data: SocialProofFeed | null }>('/social-proof', { signal: abort.signal }).then(({ data }) => { if (!abort.signal.aborted) setFeed(data); }).catch(() => { /* optional widget */ });
    return () => abort.abort();
  }, [apiOk, dismissed, locale]);
  const allowed = Boolean(feed && socialProofAllowed(feed, pathname));
  useEffect(() => {
    setCurrent(null);
    const query = new URLSearchParams(window.location.search);
    if (!feed || !allowed || dismissed || !feed.events.length || query.get('customize') === '1') return;
    let index = 0; let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (): void => {
      const event = feed.events[index];
      if (!event) return;
      if (document.visibilityState !== 'visible') { timer = setTimeout(show, 1000); return; }
      index += 1; setCurrent(event);
      timer = setTimeout(() => { setCurrent(null); timer = setTimeout(show, Math.max(0, feed.interval_seconds - feed.display_seconds) * 1000); }, feed.display_seconds * 1000);
    };
    timer = setTimeout(show, feed.first_delay_seconds * 1000);
    return () => clearTimeout(timer);
  }, [feed, allowed, dismissed]);
  if (!feed || !allowed || dismissed) return null;
  const time = current ? socialProofTime(current.minutes_ago, locale) : '';
  return <div className="sf-social-proof" data-position={feed.position} dir={ar ? 'rtl' : 'ltr'} role="status" aria-live="polite" aria-atomic="true">
    {current ? <div className="sf-social-proof__card">
      {current.product.image_url ? <img className="sf-social-proof__image" src={current.product.image_url} alt="" width={48} height={48} loading="lazy" /> : null}
      <p className="sf-social-proof__text"><span>{socialProofWho(current, locale)} {socialProofAction(locale)} </span><a href={`/products/${encodeURIComponent(current.product.slug)}`}>{current.product.name}</a>{time ? <small>{time}</small> : null}</p>
      <button type="button" className="sf-social-proof__close" aria-label={ar ? 'إخفاء إشعارات المبيعات' : 'Hide sales notifications'} onClick={() => { dismissSocialProof(store.id); setDismissed(true); }}>×</button>
    </div> : null}
  </div>;
}
