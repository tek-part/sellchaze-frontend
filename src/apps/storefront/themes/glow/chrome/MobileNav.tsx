/**
 * Glow MobileNav — start-side drawer (shared overlay mechanics: focus trap, scroll lock, ESC). Big
 * serif links, nested items expand with native <details>; account / wishlist and the language
 * switch sit at the foot.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import type { NavItem } from '../../../types/navigation';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useLocaleCode } from '../../../sections-lib';
import { glText } from '../components/i18n';
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
  return (
    <Drawer open={open} onClose={onClose} side="start" title={glText(code, 'menu')} className="gl-drawer gl-drawer--nav">
      <div className="sf-overlay__body gl-mnav">
        <button type="button" className="gl-mnav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch width={18} height={18} /> <span>{glText(code, 'searchPlaceholder')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="gl-mnav__list">
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="gl-mnav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="gl-mnav__group">
                    <summary className="gl-mnav__link gl-mnav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="gl-mnav__chev" />
                    </summary>
                    <ul className="gl-mnav__sub">
                      <li><a href={item.url} className="gl-mnav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="gl-mnav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="gl-mnav__foot">
          <a href="/account" className="gl-mnav__foot-link" onClick={onClose}><IconUser width={18} height={18} /> {glText(code, 'account')}</a>
          <a href="/wishlist" className="gl-mnav__foot-link" onClick={onClose}><IconHeart width={18} height={18} /> {glText(code, 'wishlist')}</a>
          <div className="gl-mnav__lang">
            <span>{glText(code, 'language')}</span>
            <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="gl-lang" />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
