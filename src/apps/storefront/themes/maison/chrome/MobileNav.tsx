/**
 * Maison MobileNav — the full menu in a start-side drawer (shared overlay mechanics: focus trap,
 * scroll lock, ESC). Top-level items are set large in the display serif; nested items expand with
 * native <details>. Search, account, wishlist and the language switch sit at the foot.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import type { NavItem } from '../../../types/navigation';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useLocaleCode } from '../../../sections-lib';
import { maiText } from '../components/i18n';
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
    <Drawer open={open} onClose={onClose} side="start" title={maiText(code, 'menu')} className="mai-drawer mai-drawer--nav">
      <div className="sf-overlay__body mai-mnav">
        <button type="button" className="mai-mnav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch width={18} height={18} /> <span>{maiText(code, 'searchPlaceholder')}</span>
        </button>
        <nav aria-label={t('nav.mobileNav')}>
          <ul className="mai-mnav__list">
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="mai-mnav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="mai-mnav__group">
                    <summary className="mai-mnav__link mai-mnav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="mai-mnav__chev" width={18} height={18} />
                    </summary>
                    <ul className="mai-mnav__sub">
                      <li><a href={item.url} className="mai-mnav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="mai-mnav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mai-mnav__foot">
          <a href="/account" className="mai-mnav__foot-link" onClick={onClose}><IconUser width={20} height={20} /> {t('header.account')}</a>
          <a href="/wishlist" className="mai-mnav__foot-link" onClick={onClose}><IconHeart width={20} height={20} /> {t('header.wishlist')}</a>
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="mai-mnav__lang" />
        </div>
      </div>
    </Drawer>
  );
}
