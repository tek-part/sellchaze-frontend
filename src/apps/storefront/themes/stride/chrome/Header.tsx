/**
 * Stride Header — one tight bar: menu (mobile) · wordmark · uppercase nav with drop panels
 * (desktop) · search / account / wishlist / language / bag. Sticky when `sticky_header`; gains a
 * hairline + shadow once the page scrolls. Below 1024px the nav moves into the MobileNav drawer.
 */
import { densityImage } from '../../../foundation/media/responsive';
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { LanguageSwitcher } from '../../../shared-ui';
import { CurrencySwitcher } from '../../../foundation/components/CurrencySwitcher';
import { useLocale } from '../../../i18n/useLocale';
import { IconBag, IconBolt, IconChevronDown, IconHeart, IconMenu, IconSearch, IconUser } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  sticky: boolean;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

export function Brand(props: { storeName: string; logoUrl?: string; className?: string }): ReactElement {
  return (
    <a href="/" className={cn('st-brand', props.className)} aria-label={props.storeName}>
      {props.logoUrl ? (
        <img {...densityImage(props.logoUrl, 240)} decoding="async" alt="" className="st-brand__logo" />
      ) : (
        <span className="st-brand__word">
          <span className="st-brand__mark" aria-hidden><IconBolt width={14} height={14} /></span>
          <span className="st-brand__name">{props.storeName}</span>
        </span>
      )}
    </a>
  );
}

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="st-nav" aria-label={props.label}>
      <ul className="st-nav__list">
        {props.items.slice(0, 7).map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('st-nav__item', hasMenu && 'st-nav__item--menu')}>
              <a href={item.url} className="st-nav__link" aria-haspopup={hasMenu || undefined}>
                <span>{item.label}</span>
                {hasMenu ? <IconChevronDown className="st-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="st-nav__panel">
                  {children.length > 0 ? (
                    <ul className="st-nav__col">
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="st-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="st-nav__col">
                      <li className="st-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={c.url}><a href={c.url} className="st-nav__sub">{c.label}</a></li>
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
  const { storeName, logoUrl, nav, sticky, onSearchOpen, onCartOpen, onMenuOpen } = props;
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

  return (
    <header className={cn('st-header', sticky && 'st-header--sticky', scrolled && 'is-scrolled')}>
      <div className="lib-container st-header__bar">
        <button type="button" className="st-icon-btn st-header__menu" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
          <IconMenu />
        </button>
        <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} />
        <NavBar items={nav} label={t('nav.primary')} />
        <div className="st-actions">
          <button type="button" className="st-icon-btn" aria-label={t('header.search')} onClick={onSearchOpen}>
            <IconSearch />
          </button>
          <a href="/account" className="st-icon-btn st-icon-btn--wide" aria-label={t('header.account')} title={t('header.account')}>
            <IconUser />
          </a>
          <a href="/wishlist" className="st-icon-btn st-icon-btn--wide" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
            <IconHeart />
            {wishlist.count > 0 ? <span className="st-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
          </a>
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="st-lang" />
          <CurrencySwitcher className="st-currency" />
          <button type="button" className="st-icon-btn st-icon-btn--bag" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
            <IconBag />
            {totals.count > 0 ? <span className="st-icon-btn__count st-icon-btn__count--bag" aria-hidden>{totals.count}</span> : null}
          </button>
        </div>
      </div>
    </header>
  );
}
