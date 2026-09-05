/**
 * Naseem MobileNav — the full menu in a start-side drawer (reuses the shared overlay mechanics:
 * focus trap, scroll lock, ESC). Nested items expand with native <details>.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../luxury-fashion/components/Drawer';
import type { NavItem } from '../../../types/navigation';
import { IconChevronDown, IconHeart, IconSearch, IconUser } from './icons';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';

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
  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.menu')} className="nsm-drawer">
      <div className="sf-overlay__body nsm-mobilenav">
        <button type="button" className="nsm-mobilenav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch /> <span>{t('search.placeholder')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="nsm-mobilenav__list">
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="nsm-mobilenav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="nsm-mobilenav__group">
                    <summary className="nsm-mobilenav__link nsm-mobilenav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="nsm-mobilenav__chev" />
                    </summary>
                    <ul className="nsm-mobilenav__sub">
                      <li><a href={item.url} className="nsm-mobilenav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="nsm-mobilenav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="nsm-mobilenav__foot">
          <a href="/account" className="nsm-mobilenav__foot-link" onClick={onClose}><IconUser /> {t('header.account')}</a>
          <a href="/wishlist" className="nsm-mobilenav__foot-link" onClick={onClose}><IconHeart /> {t('header.wishlist')}</a>
        </div>
        <div className="nsm-mobilenav__lang">
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} />
        </div>
      </div>
    </Drawer>
  );
}
