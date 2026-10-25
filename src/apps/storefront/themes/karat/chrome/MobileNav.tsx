/**
 * Karat MobileNav — the menu in a start-side drawer (shared overlay mechanics: focus trap, scroll
 * lock, ESC). Top-level links in the display serif; nested items open with native <details>.
 * Account, wishlist and the concierge sit at the foot.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import { LanguageSwitcher } from '../../../shared-ui';
import { CurrencySwitcher } from '../../../foundation/components/CurrencySwitcher';
import { useLocale } from '../../../i18n/useLocale';
import type { NavItem } from '../../../types/navigation';
import { useLocaleCode } from '../../../sections-lib';
import { krText, whatsappHref } from '../components/i18n';
import { IconChevronDown, IconHeart, IconSearch, IconUser, IconWhatsapp } from './icons';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  onSearchOpen: () => void;
  conciergePhone: string;
}

export function MobileNav(props: MobileNavProps): ReactElement {
  const { open, onClose, items, onSearchOpen, conciergePhone } = props;
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const { locale: current, setLocale } = useLocale();
  const wa = whatsappHref(conciergePhone);
  return (
    <Drawer open={open} onClose={onClose} side="start" title={krText(locale, 'menu')} className="kr-drawer">
      <div className="sf-overlay__body kr-mnav">
        <button type="button" className="kr-mnav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch /> <span>{krText(locale, 'searchPlaceholder')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="kr-mnav__list">
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="kr-mnav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="kr-mnav__group">
                    <summary className="kr-mnav__link kr-mnav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="kr-mnav__chev" />
                    </summary>
                    <ul className="kr-mnav__sub">
                      <li><a href={item.url} className="kr-mnav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={`${c.label}-${c.url}`}><a href={c.url} className="kr-mnav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <LanguageSwitcher ns="sf" locale={current} onChange={setLocale} label={t('header.changeLanguage')} className="kr-mnav__lang" />
        <CurrencySwitcher variant="drawer" className="kr-mnav__currency" />
        <div className="kr-mnav__foot">
          <a href="/account" className="kr-mnav__foot-link" onClick={onClose}><IconUser /> {t('header.account')}</a>
          <a href="/wishlist" className="kr-mnav__foot-link" onClick={onClose}><IconHeart /> {t('header.wishlist')}</a>
          {wa ? (
            <a href={wa} className="kr-mnav__foot-link kr-mnav__foot-link--wide" target="_blank" rel="noopener noreferrer"><IconWhatsapp /> {krText(locale, 'concierge')}</a>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}
