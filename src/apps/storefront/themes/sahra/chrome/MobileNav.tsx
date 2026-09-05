/**
 * Sahra MobileNav — the full menu in a start-side drawer (shared overlay mechanics: focus trap,
 * scroll lock, ESC). Serif top-level links, nested items expand with native <details>.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../luxury-fashion/components/Drawer';
import type { NavItem } from '../../../types/navigation';
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
  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.menu')} className="sh-drawer">
      <div className="sf-overlay__body sh-mobilenav">
        <button type="button" className="sh-mobilenav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch /> <span>{t('search.placeholder')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="sh-mobilenav__list">
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="sh-mobilenav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="sh-mobilenav__group">
                    <summary className="sh-mobilenav__link sh-mobilenav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="sh-mobilenav__chev" />
                    </summary>
                    <ul className="sh-mobilenav__sub">
                      <li><a href={item.url} className="sh-mobilenav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="sh-mobilenav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="sh-mobilenav__foot">
          <a href="/account" className="sh-mobilenav__foot-link" onClick={onClose}><IconUser /> {t('header.account')}</a>
          <a href="/wishlist" className="sh-mobilenav__foot-link" onClick={onClose}><IconHeart /> {t('header.wishlist')}</a>
        </div>
      </div>
    </Drawer>
  );
}
