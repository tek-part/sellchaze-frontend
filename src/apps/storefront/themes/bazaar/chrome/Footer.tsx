/**
 * Bazaar Footer — a marketplace footer: brand + blurb + social, a "Top categories" column, the
 * link columns from `navigation.footer`, a newsletter form (POST /storefront/newsletter), then the
 * legal row with payment marks.
 */
import { useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { FooterGroup } from '../../../types/navigation';
import type { CategoryCardModel } from '../../../types/catalog';
import { subscribeNewsletter } from '../../../api/storefront';
import { libText, useLocaleCode } from '../../../sections-lib/i18n';

export interface FooterProps {
  storeName: string;
  logoUrl?: string;
  blurb?: string;
  groups: ReadonlyArray<FooterGroup>;
  categories: ReadonlyArray<CategoryCardModel>;
  payments: ReadonlyArray<string>;
  social: ReadonlyArray<{ label: string; url: string }>;
  year: number;
}

const PAYMENT_SHORT: Record<string, string> = { Visa: 'VISA', Mastercard: 'MC', 'American Express': 'AMEX', PayPal: 'PayPal', 'Apple Pay': 'Pay', Mada: 'mada', 'STC Pay': 'stc pay', Tabby: 'tabby', Tamara: 'tamara' };

export function Footer(props: FooterProps): ReactElement {
  const { storeName, logoUrl, blurb, groups, categories, payments, social, year } = props;
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
    <footer className="bz-footer" aria-label={t('nav.footer')}>
      <div className="lib-container">
        <div className="bz-footer__grid">
          <div className="bz-footer__brand">
            <a href="/" className="bz-brand" aria-label={storeName}>
              {logoUrl ? <img src={logoUrl} alt="" className="bz-brand__logo" /> : <span className="bz-brand__name"><span className="bz-brand__mark" aria-hidden>{storeName.charAt(0)}</span>{storeName}</span>}
            </a>
            {blurb ? <p className="bz-footer__blurb">{blurb}</p> : null}
            {social.length > 0 ? (
              <ul className="bz-footer__social" aria-label={t('footer.social')}>
                {social.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></li>
                ))}
              </ul>
            ) : null}
          </div>

          {categories.length > 0 ? (
            <nav className="bz-footer__col" aria-label={t('nav.categories')}>
              <h2 className="bz-footer__title">{t('nav.categories')}</h2>
              <ul>
                {categories.map((c) => <li key={c.id}><a href={c.url} className="bz-footer__link">{c.title}</a></li>)}
                <li><a href="/categories" className="bz-footer__link bz-footer__link--all">{t('common.viewAll')}</a></li>
              </ul>
            </nav>
          ) : null}

          {groups.map((group) => (
            <nav key={group.title} className="bz-footer__col" aria-label={group.title}>
              <h2 className="bz-footer__title">{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={`${link.url}-${link.label}`}><a href={link.url} className="bz-footer__link">{link.label}</a></li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="bz-footer__col bz-footer__newsletter">
            <h2 className="bz-footer__title">{t('footer.keepInTouch')}</h2>
            <p className="bz-footer__note">{t('footer.signupNote')}</p>
            <form className="bz-footer__form" onSubmit={(e) => void submit(e)} noValidate>
              <label htmlFor="bz-footer-email" className="lib-sr-only">{t('footer.emailLabel')}</label>
              <input id="bz-footer-email" type="email" className="bz-footer__input" placeholder={libText(locale, 'emailPlaceholder')} value={email} onChange={(e) => { setEmail(e.target.value); if (status !== 'busy') setStatus('idle'); }} disabled={status === 'busy'} autoComplete="email" inputMode="email" />
              <button type="submit" className="lib-btn lib-btn--primary lib-btn--md" disabled={status === 'busy'}>{status === 'busy' ? libText(locale, 'subscribing') : t('footer.signUp')}</button>
            </form>
            {status === 'done' ? <p className="bz-footer__msg is-ok" role="status">{libText(locale, 'subscribed')}</p> : null}
            {status === 'error' ? <p className="bz-footer__msg is-err" role="status">{libText(locale, 'invalidEmail')}</p> : null}
          </div>
        </div>

        <div className="bz-footer__legal">
          <span>© {year} {storeName}</span>
          {payments.length > 0 ? (
            <ul className="bz-footer__payments" aria-label={t('footer.payments')}>
              {payments.map((p) => (
                <li key={p} className={cn('bz-footer__pay', `bz-footer__pay--${p.toLowerCase().replace(/\s+/g, '-')}`)} title={p}>{PAYMENT_SHORT[p] ?? p}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
