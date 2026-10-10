import { useEffect, useRef, type ReactElement } from 'react';
import { Button } from '../foundation/components';
import type { useBotProtection } from './useBotProtection';

interface Turnstile { render(container: HTMLElement, options: Record<string, unknown>): string; remove(id: string): void }
declare global { interface Window { turnstile?: Turnstile } }
let loading: Promise<Turnstile> | undefined;
function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loading) loading = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.defer = true;
    script.onload = () => { if (window.turnstile) resolve(window.turnstile); else { script.remove(); loading = undefined; reject(new Error('Security check unavailable')); } };
    script.onerror = () => { script.remove(); loading = undefined; reject(new Error('Security check unavailable')); };
    document.head.appendChild(script);
  });
  return loading;
}

export function CheckoutBotProtection({ model, locale }: { model: ReturnType<typeof useBotProtection>; locale: string }): ReactElement | null {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef(model); callbacks.current = model;
  const required = model.required;
  const siteKey = model.config?.site_key;
  const action = model.config?.action;
  const nonce = model.nonce;
  useEffect(() => {
    if (!required || !siteKey) return undefined;
    let active = true; let widget: string | undefined; let runtime: Turnstile | undefined;
    void loadTurnstile().then((api) => {
      if (!active || !container.current) return;
      runtime = api;
      widget = api.render(container.current, { sitekey: siteKey, action, cData: nonce, theme: 'auto', size: 'compact', language: locale,
        'response-field': false, 'refresh-expired': 'manual', 'refresh-timeout': 'manual', retry: 'never',
        callback: (token: string) => { if (active) void callbacks.current.verify(token); },
        'expired-callback': () => { if (active) callbacks.current.invalidate(true); },
        'timeout-callback': () => { if (active) callbacks.current.invalidate(); },
        'error-callback': () => { if (active) callbacks.current.invalidate(); } });
    }).catch(() => { if (active) callbacks.current.invalidate(); });
    return () => { active = false; if (runtime && widget !== undefined) runtime.remove(widget); };
  }, [required, siteKey, action, nonce, locale]);
  if (!required) return null;
  const text = (ar: string, en: string): string => locale === 'ar' ? ar : en;
  return <section className="sf-account__panel" aria-label={text('فحص الحماية', 'Security check')} style={{ display: 'grid', gap: '.75rem', padding: '1rem' }}>
    <h3>{text('فحص الحماية', 'Security check')}</h3>
    <p>{text('أكمل الفحص للمتابعة إلى إنشاء الطلب.', 'Complete the check to continue placing your order.')}</p>
    <div ref={container} />
    {model.busy ? <p role="status">{text('جارٍ التحقق…', 'Verifying…')}</p> : null}
    {model.verified ? <p role="status">{text('اكتمل فحص الحماية.', 'Security check verified.')}</p> : null}
    {model.error ? <p role="alert" style={{ color: 'inherit', fontSize: '.875rem', fontWeight: 600 }}>{model.error}</p> : null}
    {!model.verified && !model.busy ? <Button type="button" variant="secondary" onClick={model.reset}>{text('إعادة فحص الحماية', 'Run security check again')}</Button> : null}
  </section>;
}
