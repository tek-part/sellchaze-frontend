/**
 * Stride MobileNav — the menu in a start-side drawer (shared overlay mechanics: focus trap, scroll
 * lock, ESC). Big numbered uppercase links; nested items expand with native <details>; account,
 * wishlist and language sit at the foot.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import type { NavItem } from '../../../types/navigation';
import { LanguageSwitcher } from '../../../shared-ui';
import { CurrencySwitcher } from '../../../foundation/components/CurrencySwitcher';
import { useLocale } from '../../../i18n/useLocale';
import { useLocaleCode } from '../../../sections-lib';
import { stText } from '../components/i18n';
import { IconChevronDown, IconHeart, IconSearch, IconUser } from './icons';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  onSearchOpen: () => void;
}

export function MobileNav(props: MobileNavProps): ReactElement {
  const { open, onClose, items, onSearchOpen } = props;
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const code = useLocaleCode();
  const fmt = new Intl.NumberFormat(code.startsWith('ar') ? 'ar-EG' : 'en', { minimumIntegerDigits: 2 });
  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.menu')} className="st-drawer st-drawer--menu">
      <div className="sf-overlay__body st-mnav">
        <button type="button" className="st-mnav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch width={18} height={18} /> <span>{stText(code, 'searchPlaceholder')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="st-mnav__list">
            {items.map((item, i) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              const index = <span className="st-mnav__index" aria-hidden>{fmt.format(i + 1)}</span>;
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="st-mnav__link" onClick={onClose}>{index}<span className="st-mnav__label">{item.label}</span></a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="st-mnav__group">
                    <summary className="st-mnav__link st-mnav__summary">
                      {index}
                      <span className="st-mnav__label">{item.label}</span>
                      <IconChevronDown className="st-mnav__chev" />
                    </summary>
                    <ul className="st-mnav__sub">
                      <li><a href={item.url} className="st-mnav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="st-mnav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="st-mnav__foot">
          <a href="/account" className="st-mnav__foot-link" onClick={onClose}><IconUser width={18} height={18} /> {t('header.account')}</a>
          <a href="/wishlist" className="st-mnav__foot-link" onClick={onClose}><IconHeart width={18} height={18} /> {t('header.wishlist')}</a>
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="st-mnav__lang" />
          <CurrencySwitcher variant="drawer" className="st-mnav__currency" />
        </div>
      </div>
    </Drawer>
  );
}
