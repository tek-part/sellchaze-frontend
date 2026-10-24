/**
 * Karat Footer — the house mark and blurb with the concierge contact, link columns from
 * `navigation.footer`, "the private list" sign-up (POST /storefront/newsletter), then a legal row
 * with payment marks. Separated from the page by a single gold hairline.
 */
import { useState, type CSSProperties, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { FooterGroup } from '../../../types/navigation';
import { subscribeNewsletter } from '../../../api/storefront';
import { PaymentMark } from '../../../shared-ui/PaymentMarks';
import { MerchantContact } from '../../../shared-ui/MerchantContact';
import { libText, useLocaleCode } from '../../../sections-lib/i18n';
import { krText, phoneDigits, whatsappHref } from '../components/i18n';
import { Brand } from './Header';
import { IconPhone, IconWhatsapp } from './icons';

export interface FooterProps {
  storeName: string;
  logoUrl?: string;
  blurb?: string;
  phone: string;
  groups: ReadonlyArray<FooterGroup>;
  payments: ReadonlyArray<string>;
  social: ReadonlyArray<{ label: string; url: string }>;
  year: number;
}

export function Footer(props: FooterProps): ReactElement {
  const { storeName, logoUrl, blurb, phone, groups, payments, social, year } = props;
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const wa = whatsappHref(phone);

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
    <footer className="kr-footer" aria-label={t('nav.footer')}>
      <div className="lib-container">
        <div className="kr-footer__grid" style={{ '--kr-cols': groups.length } as CSSProperties}>
          <div className="kr-footer__brand">
            <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} />
            {blurb ? <p className="kr-footer__blurb">{blurb}</p> : null}
            {phone ? (
              <div className="kr-footer__contact">
                <a href={`tel:${phoneDigits(phone)}`} className="kr-footer__contact-link"><IconPhone /><bdi dir="ltr">{phone}</bdi></a>
                {wa ? <a href={wa} className="kr-footer__contact-link" target="_blank" rel="noopener noreferrer"><IconWhatsapp width={16} height={16} />{krText(locale, 'whatsapp')}</a> : null}
              </div>
            ) : null}
            {social.length > 0 ? (
              <ul className="kr-footer__social" aria-label={t('footer.social')}>
                {social.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ul>
            ) : null}
          </div>

          {groups.map((group) => (
            <nav key={group.title} className="kr-footer__col" aria-label={group.title}>
              <h2 className="kr-footer__title">{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={`${link.url}-${link.label}`}><a href={link.url} className="kr-footer__link">{link.label}</a></li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="kr-footer__col kr-footer__list">
            <h2 className="kr-footer__title">{krText(locale, 'privateList')}</h2>
            <p className="kr-footer__note">{krText(locale, 'privateListNote')}</p>
            <form className="kr-footer__form" onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor="kr-footer-email" className="lib-sr-only">{t('footer.emailLabel')}</label>
              <input
                id="kr-footer-email"
                type="email"
                className="kr-footer__input"
                placeholder={libText(locale, 'emailPlaceholder')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status !== 'busy') setStatus('idle'); }}
                disabled={status === 'busy'}
                autoComplete="email"
                inputMode="email"
              />
              <button type="submit" className="kr-footer__submit" disabled={status === 'busy'}>
                {status === 'busy' ? libText(locale, 'subscribing') : t('footer.signUp')}
              </button>
            </form>
            {status === 'done' ? <p className="kr-footer__msg is-ok" role="status">{libText(locale, 'subscribed')}</p> : null}
            {status === 'error' ? <p className="kr-footer__msg is-err" role="status">{libText(locale, 'invalidEmail')}</p> : null}
          </div>
        </div>

        <div className="kr-footer__legal">
          <span>© {year} {storeName}</span>
          {payments.length > 0 ? (
            <ul className="kr-footer__payments" aria-label={t('footer.payments')}>
              {payments.map((p, index) => (
                <li key={p} className="kr-footer__pay" title={p}><PaymentMark index={index} fallback={p} /></li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <MerchantContact />
    </footer>
  );
}
