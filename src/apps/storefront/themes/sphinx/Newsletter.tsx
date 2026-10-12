import { useState, type FormEvent, type ReactElement } from 'react';
import { useThemeSettings } from '../../theme-engine/context';
import { useLocale } from '../../i18n/useLocale';
import { subscribePhoneNewsletter } from '../../api/storefront';

export function SphinxNewsletter(): ReactElement | null {
  const settings = useThemeSettings(); const { locale } = useLocale(); const ar = locale === 'ar';
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState('');
  const text = (a: string, e: string): string => ar ? a : e;
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault(); if (busy) return; setBusy(true); setError(''); setDone(false);
    try { await subscribePhoneNewsletter({ name: name.trim(), phone: phone.trim() }); setDone(true); setName(''); setPhone(''); }
    catch (e) { setError(e instanceof Error ? e.message : text('تعذر الاشتراك. حاول مرة أخرى.', 'Unable to subscribe. Please try again.')); }
    finally { setBusy(false); }
  }
  if (settings['show_newsletter'] === false) return null;
  return <section className="sph-newsletter"><div className="sph-container"><h2>{String(settings['newsletter_heading'] || text('اشترك في النشرة الإخبارية', 'Subscribe to our newsletter'))}</h2><p>{String(settings['newsletter_text'] || '')}</p><form onSubmit={(event) => void submit(event)}><label><span className="sr-only">{text('الاسم', 'Name')}</span><input name="name" autoComplete="name" required maxLength={255} placeholder={text('الاسم', 'Name')} value={name} onChange={(event) => setName(event.target.value)} /></label><label><span className="sr-only">{text('الهاتف', 'Phone')}</span><input name="phone" type="tel" autoComplete="tel" required maxLength={40} dir="ltr" placeholder={text('الهاتف', 'Phone')} value={phone} onChange={(event) => setPhone(event.target.value)} /></label><button type="submit" disabled={busy}>{busy ? text('جارٍ الاشتراك…', 'Subscribing…') : text('اشترك في النشرة الإخبارية', 'Subscribe to our newsletter')}</button></form>{done ? <p role="status">{text('تم الاشتراك بنجاح.', 'Subscribed successfully.')}</p> : null}{error ? <p role="alert">{error}</p> : null}</div></section>;
}
