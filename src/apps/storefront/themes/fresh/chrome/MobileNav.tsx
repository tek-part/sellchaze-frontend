/**
 * Fresh MobileNav — the full aisle menu in a start-side drawer (shared overlay mechanics: focus
 * trap, scroll lock, ESC). Nested items expand with native <details>.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import type { NavItem } from '../../../types/navigation';
import { useLocale } from '../../../i18n/useLocale';
import { frText } from './text';
import { IconChevronDown, IconGrid, IconHeart, IconSearch, IconUser } from './icons';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  onSearchOpen: () => void;
}

export function MobileNav(props: MobileNavProps): ReactElement {
  const { open, onClose, items, onSearchOpen } = props;
  const { t } = useTranslation();
  const { locale } = useLocale();
  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.categories')} className="fr-drawer">
      <div className="sf-overlay__body fr-mobilenav">
        <button type="button" className="fr-mobilenav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch /> <span>{frText(locale, 'searchPlaceholder')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="fr-mobilenav__list">
            <li>
              <a href="/categories" className="fr-mobilenav__link fr-mobilenav__link--all" onClick={onClose}>
                <span><IconGrid width={18} height={18} /> {frText(locale, 'allCategories')}</span>
              </a>
            </li>
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="fr-mobilenav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="fr-mobilenav__group">
                    <summary className="fr-mobilenav__link fr-mobilenav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="fr-mobilenav__chev" />
                    </summary>
                    <ul className="fr-mobilenav__sub">
                      <li><a href={item.url} className="fr-mobilenav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="fr-mobilenav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="fr-mobilenav__foot">
          <a href="/account" className="fr-mobilenav__foot-link" onClick={onClose}><IconUser /> {t('header.account')}</a>
          <a href="/wishlist" className="fr-mobilenav__foot-link" onClick={onClose}><IconHeart /> {t('header.wishlist')}</a>
        </div>
      </div>
    </Drawer>
  );
}
