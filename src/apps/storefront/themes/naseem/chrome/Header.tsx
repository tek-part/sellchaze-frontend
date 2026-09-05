/**
 * Naseem Header — three styles from the `header_style` setting:
 *   classic  — logo · inline search bar · icons, with a category row underneath
 *   centered — logo centred between the menu button and the icons, category row underneath
 *   minimal  — logo + icons only (search opens the overlay)
 * Sticky by default; a hairline + soft shadow appear once scrolled. Nav items with children open a
 * hover/focus dropdown; everything collapses to the MobileNav drawer below 1024px.
 */
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
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
  style: string;
  sticky: boolean;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

function submitSearch(value: string): void {
  const q = value.trim();
  if (q) window.location.assign(`/search?q=${encodeURIComponent(q)}${window.location.search.includes('preview=1') ? '&preview=1' : ''}`);
}

function SearchForm(props: { placeholder: string; label: string }): ReactElement {
  const [value, setValue] = useState('');
  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    submitSearch(value);
  };
  return (
    <form className="nsm-search" role="search" onSubmit={onSubmit}>
      <label className="lib-sr-only" htmlFor="nsm-search-input">{props.label}</label>
      <input id="nsm-search-input" className="nsm-search__input" type="search" placeholder={props.placeholder} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" />
      <button type="submit" className="nsm-search__btn" aria-label={props.label}>
        <IconSearch />
      </button>
    </form>
  );
}

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="nsm-nav" aria-label={props.label}>
      <ul className="nsm-nav__list">
        {props.items.map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('nsm-nav__item', hasMenu && 'nsm-nav__item--menu')}>
              <a href={item.url} className="nsm-nav__link" aria-haspopup={hasMenu || undefined}>
                {item.label}
                {hasMenu ? <IconChevronDown className="nsm-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="nsm-nav__panel">
                  {children.length > 0 ? (
                    <ul className="nsm-nav__col">
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="nsm-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="nsm-nav__col">
                      <li className="nsm-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={c.url}><a href={c.url} className="nsm-nav__sub">{c.label}</a></li>
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
    const onScroll = (): void => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const brand = (
    <a href="/" className="nsm-brand" aria-label={storeName}>
      {logoUrl ? <img src={logoUrl} alt="" className="nsm-brand__logo" /> : <span className="nsm-brand__name">{storeName}</span>}
    </a>
  );

  const actions = (
    <div className="nsm-actions">
      <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="nsm-actions__lang" />
      {style !== 'classic' ? (
        <button type="button" className="nsm-icon-btn" aria-label={t('header.search')} onClick={onSearchOpen}>
          <IconSearch />
        </button>
      ) : (
        <button type="button" className="nsm-icon-btn nsm-icon-btn--mobile-only" aria-label={t('header.search')} onClick={onSearchOpen}>
          <IconSearch />
        </button>
      )}
      <a href="/account" className="nsm-icon-btn nsm-icon-btn--desktop" aria-label={t('header.account')} title={t('header.account')}>
        <IconUser />
      </a>
      <a href="/wishlist" className="nsm-icon-btn nsm-icon-btn--desktop" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
        <IconHeart />
        {wishlist.count > 0 ? <span className="nsm-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
      </a>
      <button type="button" className="nsm-icon-btn nsm-icon-btn--cart" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
        <IconBag />
        {totals.count > 0 ? <span className="nsm-icon-btn__count" aria-hidden>{totals.count}</span> : null}
      </button>
    </div>
  );

  const menuButton = (
    <button type="button" className="nsm-icon-btn nsm-menu-btn" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
      <IconMenu />
    </button>
  );

  return (
    <header className={cn('nsm-header', `nsm-header--${style}`, sticky && 'nsm-header--sticky', scrolled && 'is-scrolled')}>
      <div className="lib-container">
        <div className="nsm-header__bar">
          {menuButton}
          {brand}
          {style === 'classic' ? <SearchForm placeholder={t('search.placeholder')} label={t('header.search')} /> : null}
          {style === 'minimal' ? <NavBar items={nav} label={t('nav.primary')} /> : null}
          {actions}
        </div>
      </div>
      {style !== 'minimal' ? (
        <div className="nsm-header__row">
          <div className="lib-container">
            <NavBar items={nav} label={t('nav.primary')} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
