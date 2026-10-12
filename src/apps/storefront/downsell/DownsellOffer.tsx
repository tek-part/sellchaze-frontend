import { useEffect, useRef, useState, type ReactElement, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { StoreInfo } from '../state/store-context';
import { canPresent, chooseOfferCoupon, markPresented, offerDue, offerPage } from './offer-session';
import './downsell.css';
type Offer = {
  version: number; trigger: 'timer' | 'exit' | 'both'; delay_seconds: number; minimum_visit_seconds: number;
  frequency_hours: number; cart_required: boolean; title: { ar: string; en: string }; body: { ar: string; en: string }; button: { ar: string; en: string };
  background_color: string; text_color: string; accent_color: string; button_color: string; button_text_color: string; border_color: string;
  coupon: { code: string; type: string; value: string; minimum_order_amount: string | null; currency: string };
};
export default function DownsellOffer({ store, apiOk, locale, productIds: ids, hasCart }: { store: StoreInfo; apiOk: boolean; locale: string; productIds: string; hasCart: boolean }): ReactElement | null {
  const ar = locale === 'ar';
  const { pathname } = useLocation(); const navigate = useNavigate(); const entered = useRef(Date.now());
  const [shown, setShown] = useState<Offer | null>(null); const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!shown || !dialog.current) return;
    dialog.current.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [shown]);
  useEffect(() => {
    setShown(null); setCopied(false);
    const query = new URLSearchParams(window.location.search);
    if (!apiOk || !store.downsellEnabled || !offerPage(pathname) || query.get('customize') === '1' || query.get('preview') === '1') return;
    const abort = new AbortController(); let timer: ReturnType<typeof setTimeout> | undefined; let busy = false;
    const params = new URLSearchParams(); ids.split(',').filter(Boolean).forEach((id) => params.append('product_ids[]', id));
    if (pathname.startsWith('/products/')) {
      try { params.set('product_slug', decodeURIComponent(pathname.split('/')[2] ?? '')); } catch { return; }
    }
    const load = () => apiFetch<{ data: Offer | null }>(`/downsell?${params}`, { signal: abort.signal, cache: 'no-store' });
    let current: Offer | null = null;
    const show = async (event: 'timer' | 'exit') => {
      if (busy || !current || document.visibilityState !== 'visible' || !offerDue(current.trigger, event, Date.now() - entered.current, current.delay_seconds, current.minimum_visit_seconds) || (current.cart_required && !hasCart) || !canPresent(store, current.version, current.frequency_hours)) return;
      busy = true;
      try {
        const fresh = (await load()).data;
        if (!abort.signal.aborted && fresh && fresh.version === current.version && (!fresh.cart_required || hasCart) && canPresent(store, fresh.version, fresh.frequency_hours)) {
          markPresented(store, fresh.version); setShown(fresh);
        }
      } catch { /* An unavailable offer is optional and cannot interrupt shopping. */ }
      finally { busy = false; }
    };
    const exit = (event: MouseEvent) => { if (event.relatedTarget === null && event.clientY <= 0) void show('exit'); };
    const resume = () => { void show('timer'); };
    void load().then(({ data }) => {
      current = data; if (!data || abort.signal.aborted) return;
      timer = setTimeout(() => { void show('timer'); }, Math.max(0, Math.max(data.delay_seconds, data.minimum_visit_seconds) * 1000 - (Date.now() - entered.current)));
      document.addEventListener('mouseout', exit); document.addEventListener('visibilitychange', resume);
    }).catch(() => {});
    return () => { abort.abort(); clearTimeout(timer); document.removeEventListener('mouseout', exit); document.removeEventListener('visibilitychange', resume); };
  }, [store, apiOk, pathname, ids, hasCart]);
  if (!shown) return null;
  const text = (value: { ar: string; en: string }) => ar ? value.ar : value.en;
  const variables = { '--offer-bg': shown.background_color, '--offer-ink': shown.text_color, '--offer-accent': shown.accent_color,
    '--offer-button': shown.button_color, '--offer-button-ink': shown.button_text_color, '--offer-border': shown.border_color } as CSSProperties;
  return <dialog ref={dialog} className="sf-downsell" aria-labelledby="sf-downsell-title" onCancel={(event) => { event.preventDefault(); setShown(null); }} onClick={(event) => { if (event.target === event.currentTarget) setShown(null); }}>
    <div className="sf-downsell__content" style={variables} dir={ar ? 'rtl' : 'ltr'}>
      <button type="button" className="sf-downsell__close" onClick={() => setShown(null)} aria-label={ar ? 'إغلاق العرض' : 'Close offer'}>×</button>
      <h2 id="sf-downsell-title">{text(shown.title)}</h2>
      <p className="sf-downsell__discount">{shown.coupon.type === 'percentage' ? `${Number(shown.coupon.value)}%` : `${Number(shown.coupon.value)} ${shown.coupon.currency}`} {ar ? 'خصم' : 'off'}</p>
      <p>{text(shown.body)}</p>
      <button type="button" className="sf-downsell__code" onClick={async () => { try { await navigator.clipboard.writeText(shown.coupon.code); setCopied(true); } catch { setCopied(false); } }} aria-label={ar ? 'نسخ الكوبون' : 'Copy coupon'}><strong dir="ltr">{shown.coupon.code}</strong><span>{copied ? (ar ? 'تم النسخ' : 'Copied') : (ar ? 'نسخ' : 'Copy')}</span></button>
      {Number(shown.coupon.minimum_order_amount) > 0 ? <p className="sf-downsell__minimum">{ar ? 'للطلبات بقيمة' : 'For orders of'} {Number(shown.coupon.minimum_order_amount)} {shown.coupon.currency} {ar ? 'أو أكثر' : 'or more'}</p> : null}
      <button type="button" className="sf-downsell__action" onClick={() => { chooseOfferCoupon(store, shown.coupon.code); setShown(null); navigate('/checkout'); }}>{text(shown.button)}</button>
    </div>
  </dialog>;
}
