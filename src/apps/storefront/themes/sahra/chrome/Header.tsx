/**
 * Sahra Header — two styles from the `header_style` setting:
 *   centered — logo in the middle of the bar, utility icons pinned to both edges (search + language
 *              at the start, account / wishlist / bag at the end), navigation on its own ruled row
 *   classic  — logo at the start, navigation inline in the centre, icons at the end
 * Sticky by default; a hairline gold rule + soft shadow appear once scrolled. Nav items with
 * children open a hover/focus panel; everything collapses to the MobileNav drawer below 1024px.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { IconBag, IconChevronDown, IconHeart, IconMenu, IconSearch, IconUser } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  style: 'centered' | 'classic';
  sticky: boolean;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="sh-nav" aria-label={props.label}>
      <ul className="sh-nav__list">
        {props.items.map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('sh-nav__item', hasMenu && 'sh-nav__item--menu')}>
              <a href={item.url} className="sh-nav__link" aria-haspopup={hasMenu || undefined}>
                <span className="sh-nav__label">{item.label}</span>
                {hasMenu ? <IconChevronDown className="sh-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="sh-nav__panel">
                  {children.length > 0 ? (
                    <ul className="sh-nav__col">
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="sh-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="sh-nav__col">
                      <li className="sh-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={c.url}><a href={c.url} className="sh-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Header(props: HeaderProps): ReactElement {
  const { storeName, logoUrl, nav, style, sticky, onSearchOpen, onCartOpen, onMenuOpen } = props;
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { totals } = useCart();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const brand = (
    <a href="/" className="sh-brand" aria-label={storeName}>
      {logoUrl ? <img src={logoUrl} alt="" className="sh-brand__logo" /> : <span className="sh-brand__name">{storeName}</span>}
    </a>
  );

  const menuButton = (
    <button type="button" className="sh-icon-btn sh-menu-btn" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
      <IconMenu />
    </button>
  );

  const searchButton = (
    <button type="button" className="sh-icon-btn" aria-label={t('header.search')} onClick={onSearchOpen}>
      <IconSearch />
    </button>
  );

  const language = <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="sh-lang" />;

  const commerce = (
    <>
      <a href="/account" className="sh-icon-btn sh-icon-btn--desktop" aria-label={t('header.account')} title={t('header.account')}>
        <IconUser />
      </a>
      <a href="/wishlist" className="sh-icon-btn sh-icon-btn--desktop" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
        <IconHeart />
        {wishlist.count > 0 ? <span className="sh-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
      </a>
      <button type="button" className="sh-icon-btn sh-icon-btn--cart" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
        <IconBag />
        {totals.count > 0 ? <span className="sh-icon-btn__count" aria-hidden>{totals.count}</span> : null}
      </button>
    </>
  );

  return (
    <header className={cn('sh-header', `sh-header--${style}`, sticky && 'sh-header--sticky', scrolled && 'is-scrolled')}>
      <div className="lib-container">
        {style === 'centered' ? (
          <div className="sh-header__bar">
            <div className="sh-header__edge sh-header__edge--start">
              {menuButton}
              {searchButton}
              {language}
            </div>
            {brand}
            <div className="sh-header__edge sh-header__edge--end">{commerce}</div>
          </div>
        ) : (
          <div className="sh-header__bar">
            <div className="sh-header__edge sh-header__edge--start">
              {menuButton}
              {brand}
            </div>
            <NavBar items={nav} label={t('nav.primary')} />
            <div className="sh-header__edge sh-header__edge--end">
              {language}
              {searchButton}
              {commerce}
            </div>
          </div>
        )}
      </div>
      {style === 'centered' ? (
        <div className="sh-header__row">
          <div className="lib-container">
            <NavBar items={nav} label={t('nav.primary')} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
