/**
 * Stride Footer — a newsletter band (POST /storefront/newsletter), brand + link columns from
 * `navigation.footer`, the merchant contact block, payment marks + legal row, and the store name
 * set huge in outline across the bottom edge (decorative).
 */
import { useId, useState, type CSSProperties, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { FooterGroup } from '../../../types/navigation';
import { subscribeNewsletter } from '../../../api/storefront';
import { PaymentMark } from '../../../shared-ui/PaymentMarks';
import { MerchantContact } from '../../../shared-ui/MerchantContact';
import { libText, useLocaleCode } from '../../../sections-lib/i18n';
import { stText } from '../components/i18n';
import { Brand } from './Header';

export interface FooterProps {
  storeName: string;
  logoUrl?: string;
  blurb?: string;
  groups: ReadonlyArray<FooterGroup>;
  payments: ReadonlyArray<string>;
  social: ReadonlyArray<{ label: string; url: string }>;
  year: number;
}

const PAYMENT_SHORT: Record<string, string> = { Visa: 'VISA', Mastercard: 'MC', 'American Express': 'AMEX', PayPal: 'PayPal', 'Apple Pay': 'Pay', Mada: 'mada', 'STC Pay': 'stc pay', Tabby: 'tabby', Tamara: 'tamara' };

export function Footer(props: FooterProps): ReactElement {
  const { storeName, logoUrl, blurb, groups, payments, social, year } = props;
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const emailId = useId();
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
    <footer className="st-footer" aria-label={t('nav.footer')}>
      <div className="st-footer__club">
        <div className="lib-container st-footer__club-inner">
          <div>
            <h2 className="st-display st-footer__club-title">{t('footer.keepInTouch')}</h2>
            <p className="st-footer__club-note">{t('footer.signupNote')}</p>
          </div>
          <div>
            <form className="st-footer__form" onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor={emailId} className="lib-sr-only">{t('footer.emailLabel')}</label>
              <input id={emailId} type="email" className="st-footer__input" placeholder={libText(locale, 'emailPlaceholder')} value={email} onChange={(e) => { setEmail(e.target.value); if (status !== 'busy') setStatus('idle'); }} disabled={status === 'busy'} autoComplete="email" inputMode="email" />
              <button type="submit" className="st-btn st-footer__submit" disabled={status === 'busy'}>{status === 'busy' ? libText(locale, 'subscribing') : t('footer.signUp')}</button>
            </form>
            {status === 'done' ? <p className="st-footer__msg is-ok" role="status">{libText(locale, 'subscribed')}</p> : null}
            {status === 'error' ? <p className="st-footer__msg is-err" role="status">{libText(locale, 'invalidEmail')}</p> : null}
          </div>
        </div>
      </div>

      <div className="lib-container">
        <div className="st-footer__grid" style={{ '--st-footer-cols': Math.max(1, groups.length) } as CSSProperties}>
          <div className="st-footer__brand">
            <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} className="st-brand--footer" />
            {blurb ? <p className="st-footer__blurb">{blurb}</p> : null}
            {social.length > 0 ? (
              <ul className="st-footer__social" aria-label={stText(locale, 'followUs')}>
                {social.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ul>
            ) : null}
          </div>
          {groups.map((group) => (
            <nav key={group.title} className="st-footer__col" aria-label={group.title}>
              <h2 className="st-footer__title">{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={`${link.url}-${link.label}`}><a href={link.url} className="st-footer__link">{link.label}</a></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="st-footer__contact"><MerchantContact /></div>
      <div className="lib-container">
        <div className="st-footer__legal">
          <span>© {year} {storeName}</span>
          {payments.length > 0 ? (
            <ul className="st-footer__payments" aria-label={t('footer.payments')}>
              {payments.map((p, index) => (
                <li key={p} className={cn('st-footer__pay', `st-footer__pay--${p.toLowerCase().replace(/\s+/g, '-')}`)} title={p}><PaymentMark index={index} fallback={PAYMENT_SHORT[p] ?? p} /></li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div className="st-footer__giant" aria-hidden>
        <span>{storeName}</span>
      </div>
    </footer>
  );
}
