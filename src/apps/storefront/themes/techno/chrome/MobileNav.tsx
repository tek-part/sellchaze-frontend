/**
 * Techno MobileNav — the full menu in a start-side drawer (shared overlay mechanics: focus trap,
 * scroll lock, ESC). Nested items expand with native <details>; support hotline pinned at the foot.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../luxury-fashion/components/Drawer';
import type { NavItem } from '../../../types/navigation';
import { useLocaleCode } from '../../../sections-lib';
import { tkText } from '../components/i18n';
import { IconChevronDown, IconCompare, IconHeart, IconPhone, IconSearch, IconUser } from './icons';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  onSearchOpen: () => void;
  onCompareOpen: () => void;
  supportPhone?: string;
}

export function MobileNav(props: MobileNavProps): ReactElement {
  const { open, onClose, items, onSearchOpen, onCompareOpen, supportPhone } = props;
  const { t } = useTranslation();
  const locale = useLocaleCode();
  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.menu')} className="tk-drawer">
      <div className="sf-overlay__body tk-mobilenav">
        <button type="button" className="tk-mobilenav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch /> <span>{tkText(locale, 'searchProducts')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="tk-mobilenav__list">
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="tk-mobilenav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="tk-mobilenav__group">
                    <summary className="tk-mobilenav__link tk-mobilenav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="tk-mobilenav__chev" />
                    </summary>
                    <ul className="tk-mobilenav__sub">
                      <li><a href={item.url} className="tk-mobilenav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="tk-mobilenav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="tk-mobilenav__foot">
          <a href="/account" className="tk-mobilenav__foot-link" onClick={onClose}><IconUser /> {t('header.account')}</a>
          <a href="/wishlist" className="tk-mobilenav__foot-link" onClick={onClose}><IconHeart /> {t('header.wishlist')}</a>
          <button type="button" className="tk-mobilenav__foot-link" onClick={() => { onClose(); onCompareOpen(); }}><IconCompare /> {tkText(locale, 'compare')}</button>
          {supportPhone ? (
            <a href={`tel:${supportPhone.replace(/[^\d+]/g, '')}`} className="tk-mobilenav__foot-link tk-mobilenav__foot-link--phone" dir="ltr"><IconPhone /> {supportPhone}</a>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}
