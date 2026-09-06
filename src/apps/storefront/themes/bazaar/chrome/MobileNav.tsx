/**
 * Bazaar MobileNav — the hamburger drawer on phones/tablets: search shortcut, the category list
 * (with thumbnails), the store nav as accordions, account / wishlist shortcuts and the language
 * switcher. Reuses the shared Drawer (focus trap, scroll lock, ESC).
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../../foundation/components/Drawer';
import type { NavItem } from '../../../types/navigation';
import type { CategoryCardModel } from '../../../types/catalog';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { IconChevronDown, IconGrid, IconHeart, IconSearch, IconUser } from './icons';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  items: ReadonlyArray<NavItem>;
  categories: ReadonlyArray<CategoryCardModel>;
  onSearchOpen: () => void;
}

export function MobileNav(props: MobileNavProps): ReactElement {
  const { open, onClose, items, categories, onSearchOpen } = props;
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  return (
    <Drawer open={open} onClose={onClose} side="start" title={t('nav.menu')} className="bz-drawer">
      <div className="sf-overlay__body bz-mobilenav">
        <button type="button" className="bz-mobilenav__search" onClick={() => { onClose(); onSearchOpen(); }}>
          <IconSearch /> <span>{t('search.placeholder')}</span>
        </button>

        {categories.length > 0 ? (
          <section className="bz-mobilenav__section" aria-label={t('nav.categories')}>
            <h3 className="bz-mobilenav__heading">{t('nav.shopByCategory')}</h3>
            <ul className="bz-mobilenav__cats">
              {categories.map((c) => (
                <li key={c.id}>
                  <a href={c.url} className="bz-mobilenav__cat" onClick={onClose}>
                    <span className="bz-mobilenav__thumb">{c.image?.src ? <img src={c.image.src} alt="" loading="lazy" /> : <IconGrid />}</span>
                    <span className="bz-mobilenav__cat-name">{c.title}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href="/categories" className="bz-mobilenav__cat bz-mobilenav__cat--all" onClick={onClose}>
                  <span className="bz-mobilenav__thumb"><IconGrid /></span>
                  <span className="bz-mobilenav__cat-name">{t('common.viewAll')}</span>
                </a>
              </li>
            </ul>
          </section>
        ) : null}

        <nav aria-label={t('nav.mobileNav')}>
          <ul className="bz-mobilenav__list">
            {items.map((item) => {
              const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
              if (children.length === 0) {
                return (
                  <li key={`${item.label}-${item.url}`}>
                    <a href={item.url} className="bz-mobilenav__link" onClick={onClose}>{item.label}</a>
                  </li>
                );
              }
              return (
                <li key={`${item.label}-${item.url}`}>
                  <details className="bz-mobilenav__group">
                    <summary className="bz-mobilenav__link bz-mobilenav__summary">
                      <span>{item.label}</span>
                      <IconChevronDown className="bz-mobilenav__chev" />
                    </summary>
                    <ul className="bz-mobilenav__sub">
                      <li><a href={item.url} className="bz-mobilenav__sublink" onClick={onClose}>{t('common.viewAll')}</a></li>
                      {children.map((c) => (
                        <li key={`${c.label}-${c.url}`}><a href={c.url} className="bz-mobilenav__sublink" onClick={onClose}>{c.label}</a></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="bz-mobilenav__foot">
          <a href="/account" className="bz-mobilenav__foot-link" onClick={onClose}><IconUser /> {t('header.account')}</a>
          <a href="/wishlist" className="bz-mobilenav__foot-link" onClick={onClose}><IconHeart /> {t('header.wishlist')}</a>
        </div>
        <div className="bz-mobilenav__lang">
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} />
        </div>
      </div>
    </Drawer>
  );
}
