import { useId, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { subscribeNewsletter } from '../../api/storefront';
import { useLocale } from '../../i18n/useLocale';

export function PetsNewsletter({ title, text }: { title: string; text: string }): ReactElement {
  const ar = useLocale().locale === 'ar'; const id = useId(); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [status, setStatus] = useState(''); const sending = useRef(false);
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault(); if (sending.current) return; sending.current = true; setBusy(true); setStatus('');
    try { await subscribeNewsletter(email.trim()); setEmail(''); setStatus(ar ? 'تم الاشتراك بنجاح.' : 'You are subscribed.'); }
    catch { setStatus(ar ? 'تعذر الاشتراك. حاول مجددًا.' : 'Unable to subscribe. Please try again.'); }
    finally { sending.current = false; setBusy(false); }
  }
  return <div className="bpt-newsletter"><h2>{title}</h2><p>{text}</p><form onSubmit={event => void submit(event)}><label className="lib-sr-only" htmlFor={id}>{ar ? 'البريد الإلكتروني' : 'Email address'}</label><input id={id} type="email" autoComplete="email" maxLength={255} required value={email} disabled={busy} placeholder={ar ? 'أدخل بريدك الإلكتروني' : 'Enter your email'} onChange={event => setEmail(event.target.value)} /><button disabled={busy}>{busy ? '…' : ar ? 'اشترك' : 'Subscribe'}</button></form>{status ? <p role="status">{status}</p> : null}</div>;
}
