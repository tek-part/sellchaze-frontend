/**
 * Glow Footer — a blush (or sand / plum) panel: newsletter on top with a large serif line, then the
 * wordmark + blurb + social, link columns from `navigation.footer`, and a legal row with payment
 * marks. The newsletter posts to /storefront/newsletter.
 */
import { useId, useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { FooterGroup } from '../../../types/navigation';
import { subscribeNewsletter } from '../../../api/storefront';
import { PaymentMark } from '../../../shared-ui/PaymentMarks';
import { MerchantContact } from '../../../shared-ui/MerchantContact';
import { libText, useLocaleCode } from '../../../sections-lib/i18n';
import { glText } from '../components/i18n';
import { Brand } from './Header';
import { IconArrow } from './icons';

export interface FooterProps {
  storeName: string;
  logoUrl?: string;
  blurb?: string;
  groups: ReadonlyArray<FooterGroup>;
  payments: ReadonlyArray<string>;
  social: ReadonlyArray<{ label: string; url: string }>;
  year: number;
}

const PAYMENT_SHORT: Readonly<Record<string, string>> = { Visa: 'VISA', Mastercard: 'MC', 'American Express': 'AMEX', PayPal: 'PayPal', 'Apple Pay': 'Pay', Mada: 'mada', 'STC Pay': 'stc pay', Tabby: 'tabby', Tamara: 'tamara', Valu: 'valU', Fawry: 'Fawry' };

export function Footer(props: FooterProps): ReactElement {
  const { storeName, logoUrl, blurb, groups, payments, social, year } = props;
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const inputId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error');
      return;
    }
    setStatus('busy');
    try {
      await subscribeNewsletter(email.trim());
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="gl-footer" aria-label={t('nav.footer')}>
      <div className="lib-container">
        <div className="gl-footer__news">
          <div className="gl-footer__news-copy">
            <h2 className="gl-footer__news-title">{glText(locale, 'newsletterTitle')}</h2>
            <p className="gl-footer__news-note">{glText(locale, 'newsletterNote')}</p>
          </div>
          <form className="gl-footer__form" onSubmit={(e) => void submit(e)} noValidate>
            <label htmlFor={inputId} className="lib-sr-only">{t('footer.emailLabel')}</label>
            <input id={inputId} type="email" className="gl-footer__input" placeholder={libText(locale, 'emailPlaceholder')} value={email} onChange={(e) => { setEmail(e.target.value); if (status !== 'busy') setStatus('idle'); }} disabled={status === 'busy'} autoComplete="email" inputMode="email" aria-describedby={status === 'idle' ? undefined : `${inputId}-msg`} />
            <button type="submit" className="gl-footer__submit" disabled={status === 'busy'}>
              <span>{status === 'busy' ? libText(locale, 'subscribing') : t('footer.signUp')}</span>
              <IconArrow />
            </button>
            {status === 'done' ? <p id={`${inputId}-msg`} className="gl-footer__msg is-ok" role="status">{libText(locale, 'subscribed')}</p> : null}
            {status === 'error' ? <p id={`${inputId}-msg`} className="gl-footer__msg is-err" role="status">{libText(locale, 'invalidEmail')}</p> : null}
          </form>
        </div>

        <div className="gl-footer__grid" style={{ ['--gl-footer-cols' as string]: Math.max(1, groups.length) }}>
          <div className="gl-footer__brand">
            <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} className="gl-brand--footer" />
            {blurb ? <p className="gl-footer__blurb">{blurb}</p> : null}
            {social.length > 0 ? (
              <ul className="gl-footer__social" aria-label={t('footer.social')}>
                {social.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ul>
            ) : null}
          </div>
          {groups.map((group) => (
            <nav key={group.title} className="gl-footer__col" aria-label={group.title}>
              <h2 className="gl-footer__title">{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={`${link.url}-${link.label}`}><a href={link.url} className="gl-footer__link">{link.label}</a></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="gl-footer__legal">
          <span>© {year} {storeName} · {glText(locale, 'allRights')}</span>
          {payments.length > 0 ? (
            <ul className="gl-footer__payments" aria-label={t('footer.payments')}>
              {payments.map((p, index) => (
                <li key={p} className="gl-footer__pay" title={p}><PaymentMark index={index} fallback={PAYMENT_SHORT[p] ?? p} /></li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <MerchantContact />
    </footer>
  );
}
