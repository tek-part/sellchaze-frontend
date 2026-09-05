/**
 * Sahra Footer — a large serif brand statement with a newsletter form (POST /storefront/newsletter)
 * beside it, thin gold rules, link columns from `navigation.footer`, social links, payment marks and
 * the legal row.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { FooterGroup } from '../../../types/navigation';
import { subscribeNewsletter } from '../../../api/storefront';
import { libText, useLocaleCode } from '../../../sections-lib/i18n';
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

const PAYMENT_SHORT: Record<string, string> = { Visa: 'VISA', Mastercard: 'MC', 'American Express': 'AMEX', PayPal: 'PayPal', 'Apple Pay': 'Pay', Mada: 'mada', 'STC Pay': 'stc pay', Tabby: 'tabby', Tamara: 'tamara' };

const STATEMENT: Record<string, string> = {
  ar: 'فخامةٌ تُهدى، وذكرياتٌ تبقى.',
  en: 'Luxury to gift, memories to keep.',
};

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
    <footer className="sh-footer" aria-label={t('nav.footer')}>
      <div className="lib-container">
        <div className="sh-footer__statement">
          <div className="sh-footer__brand">
            <a href="/" className="sh-brand sh-brand--footer" aria-label={storeName}>
              {logoUrl ? <img src={logoUrl} alt="" className="sh-brand__logo" /> : <span className="sh-brand__name">{storeName}</span>}
            </a>
            <p className="sh-footer__tagline">{STATEMENT[locale] ?? STATEMENT['en']}</p>
            {blurb ? <p className="sh-footer__blurb">{blurb}</p> : null}
          </div>

          <div className="sh-footer__newsletter">
            <h2 className="sh-footer__title">{t('footer.keepInTouch')}</h2>
            <p className="sh-footer__note">{t('footer.signupNote')}</p>
            <form className="sh-footer__form" onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor="sh-footer-email" className="lib-sr-only">{t('footer.emailLabel')}</label>
              <input id="sh-footer-email" type="email" className="sh-footer__input" placeholder={libText(locale, 'emailPlaceholder')} value={email} onChange={(e) => { setEmail(e.target.value); if (status !== 'busy') setStatus('idle'); }} disabled={status === 'busy'} autoComplete="email" inputMode="email" />
              <button type="submit" className="sh-footer__submit" disabled={status === 'busy'} aria-label={t('footer.signUp')}>
                <span>{status === 'busy' ? libText(locale, 'subscribing') : t('footer.signUp')}</span>
                <IconArrow className="sh-footer__arrow" />
              </button>
            </form>
            {status === 'done' ? <p className="sh-footer__msg is-ok" role="status">{libText(locale, 'subscribed')}</p> : null}
            {status === 'error' ? <p className="sh-footer__msg is-err" role="status">{libText(locale, 'invalidEmail')}</p> : null}
          </div>
        </div>

        {groups.length > 0 || social.length > 0 ? (
          <div className="sh-footer__grid">
            {groups.map((group) => (
              <nav key={group.title} className="sh-footer__col" aria-label={group.title}>
                <h2 className="sh-footer__title">{group.title}</h2>
                <ul>
                  {group.links.map((link) => (
                    <li key={`${link.url}-${link.label}`}><a href={link.url} className="sh-footer__link">{link.label}</a></li>
                  ))}
                </ul>
              </nav>
            ))}
            {social.length > 0 ? (
              <div className="sh-footer__col">
                <h2 className="sh-footer__title">{t('footer.social')}</h2>
                <ul className="sh-footer__social" aria-label={t('footer.social')}>
                  {social.map((s) => (
                    <li key={s.url}><a href={s.url} className="sh-footer__link" target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="sh-footer__legal">
          <span>© {year} {storeName}</span>
          {payments.length > 0 ? (
            <ul className="sh-footer__payments" aria-label={t('footer.payments')}>
              {payments.map((p) => (
                <li key={p} className={cn('sh-footer__pay', `sh-footer__pay--${p.toLowerCase().replace(/\s+/g, '-')}`)} title={p}>{PAYMENT_SHORT[p] ?? p}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
