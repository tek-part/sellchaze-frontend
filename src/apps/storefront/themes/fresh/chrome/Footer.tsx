/**
 * Fresh Footer — brand + blurb, link columns from `navigation.footer`, a newsletter form
 * (POST /storefront/newsletter), social pills, payment marks and the legal row.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { FooterGroup } from '../../../types/navigation';
import { subscribeNewsletter } from '../../../api/storefront';
import { libText, useLocaleCode } from '../../../sections-lib/i18n';
import { IconLeaf } from './icons';

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
    <footer className="fr-footer" aria-label={t('nav.footer')}>
      <div className="lib-container">
        <div className="fr-footer__grid">
          <div className="fr-footer__brand">
            <a href="/" className="fr-brand" aria-label={storeName}>
              {logoUrl ? <img src={logoUrl} alt="" className="fr-brand__logo" /> : (
                <>
                  <span className="fr-brand__mark" aria-hidden><IconLeaf width={20} height={20} /></span>
                  <span className="fr-brand__name">{storeName}</span>
                </>
              )}
            </a>
            {blurb ? <p className="fr-footer__blurb">{blurb}</p> : null}
            {social.length > 0 ? (
              <ul className="fr-footer__social" aria-label={t('footer.social')}>
                {social.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ul>
            ) : null}
          </div>

          {groups.map((group) => (
            <nav key={group.title} className="fr-footer__col" aria-label={group.title}>
              <h2 className="fr-footer__title">{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={`${link.url}-${link.label}`}><a href={link.url} className="fr-footer__link">{link.label}</a></li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="fr-footer__col fr-footer__newsletter">
            <h2 className="fr-footer__title">{t('footer.keepInTouch')}</h2>
            <p className="fr-footer__note">{t('footer.signupNote')}</p>
            <form className="fr-footer__form" onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor="fr-footer-email" className="lib-sr-only">{t('footer.emailLabel')}</label>
              <input id="fr-footer-email" type="email" className="fr-footer__input" placeholder={libText(locale, 'emailPlaceholder')} value={email} onChange={(e) => { setEmail(e.target.value); if (status !== 'busy') setStatus('idle'); }} disabled={status === 'busy'} autoComplete="email" inputMode="email" />
              <button type="submit" className="lib-btn lib-btn--primary lib-btn--md" disabled={status === 'busy'}>{status === 'busy' ? libText(locale, 'subscribing') : t('footer.signUp')}</button>
            </form>
            {status === 'done' ? <p className="fr-footer__msg is-ok" role="status">{libText(locale, 'subscribed')}</p> : null}
            {status === 'error' ? <p className="fr-footer__msg is-err" role="status">{libText(locale, 'invalidEmail')}</p> : null}
          </div>
        </div>

        <div className="fr-footer__legal">
          <span>© {year} {storeName}</span>
          {payments.length > 0 ? (
            <ul className="fr-footer__payments" aria-label={t('footer.payments')}>
              {payments.map((p) => (
                <li key={p} className={cn('fr-footer__pay', `fr-footer__pay--${p.toLowerCase().replace(/\s+/g, '-')}`)} title={p}>{PAYMENT_SHORT[p] ?? p}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
