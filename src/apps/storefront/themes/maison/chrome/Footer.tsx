/**
 * Maison Footer — a warm closing spread: a large serif statement and the newsletter on one side,
 * the store's link columns on the other, then social links, payment marks and the legal row.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { FooterGroup } from '../../../types/navigation';
import { subscribeNewsletter } from '../../../api/storefront';
import { PaymentMark } from '../../../shared-ui/PaymentMarks';
import { MerchantContact } from '../../../shared-ui/MerchantContact';
import { libText, useLocaleCode } from '../../../sections-lib/i18n';
import { useLibId } from '../../../sections-lib';
import { Brand } from './Header';
import { IconArrow } from './icons';

export interface FooterProps {
  storeName: string;
  logoUrl?: string;
  blurb?: string;
  statement: string;
  groups: ReadonlyArray<FooterGroup>;
  payments: ReadonlyArray<string>;
  social: ReadonlyArray<{ label: string; url: string }>;
  year: number;
}

const PAYMENT_SHORT: Record<string, string> = { Visa: 'VISA', Mastercard: 'MC', 'American Express': 'AMEX', PayPal: 'PayPal', 'Apple Pay': 'Pay', Mada: 'mada', 'STC Pay': 'stc pay', Tabby: 'tabby', Tamara: 'tamara' };

export function Footer(props: FooterProps): ReactElement {
  const { storeName, logoUrl, blurb, statement, groups, payments, social, year } = props;
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const inputId = useLibId('mai-footer-email');
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
    <footer className="mai-footer" aria-label={t('nav.footer')}>
      <div className="lib-container">
        <div className="mai-footer__top">
          <div className="mai-footer__lead">
            <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} className="mai-brand--footer" />
            {statement ? <p className="mai-footer__statement">{statement}</p> : null}
            {blurb ? <p className="mai-footer__blurb">{blurb}</p> : null}
            <form className="mai-footer__form" onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor={inputId} className="mai-footer__label">{t('footer.keepInTouch')}</label>
              <div className="mai-footer__field">
                <input id={inputId} type="email" className="mai-footer__input" placeholder={libText(locale, 'emailPlaceholder')} value={email} onChange={(e) => { setEmail(e.target.value); if (status !== 'busy') setStatus('idle'); }} disabled={status === 'busy'} autoComplete="email" inputMode="email" />
                <button type="submit" className="mai-footer__submit" disabled={status === 'busy'}>
                  <span className="mai-footer__submit-text">{status === 'busy' ? libText(locale, 'subscribing') : t('footer.signUp')}</span>
                  <IconArrow />
                </button>
              </div>
              {status === 'done' ? <p className="mai-footer__msg is-ok" role="status">{libText(locale, 'subscribed')}</p> : null}
              {status === 'error' ? <p className="mai-footer__msg is-err" role="status">{libText(locale, 'invalidEmail')}</p> : null}
            </form>
          </div>

          {groups.length > 0 ? (
            <div className="mai-footer__cols">
              {groups.map((group) => (
                <nav key={group.title} className="mai-footer__col" aria-label={group.title}>
                  <h2 className="mai-footer__title">{group.title}</h2>
                  <ul>
                    {group.links.map((link) => (
                      <li key={`${link.url}-${link.label}`}><a href={link.url} className="mai-footer__link">{link.label}</a></li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mai-footer__legal">
          <span>© {year} {storeName}</span>
          {social.length > 0 ? (
            <ul className="mai-footer__social" aria-label={t('footer.social')}>
              {social.map((s) => (
                <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
              ))}
            </ul>
          ) : null}
          {payments.length > 0 ? (
            <ul className="mai-footer__payments" aria-label={t('footer.payments')}>
              {payments.map((p, index) => (
                <li key={p} className="mai-footer__pay" title={p}><PaymentMark index={index} fallback={PAYMENT_SHORT[p] ?? p} /></li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <MerchantContact />
    </footer>
  );
}
