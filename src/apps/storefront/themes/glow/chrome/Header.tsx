/**
 * Glow Header — a quiet, translucent bar: [menu · search] [wordmark] [account · wishlist · bag].
 * The wordmark sits centred (or at the start, per `logo_position`); on desktop the navigation runs
 * underneath as a centred row of serif-free caps links with soft dropdown panels. Sticky with a
 * hairline + blur once scrolled. Below 1024px the navigation lives in the MobileNav drawer.
 */
import { densityImage } from '../../../foundation/media/responsive';
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useLocaleCode } from '../../../sections-lib';
import { glText } from '../components/i18n';
import { IconBag, IconChevronDown, IconHeart, IconMenu, IconSearch, IconUser } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  sticky: boolean;
  logoPosition: 'center' | 'start';
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

export function Brand(props: { storeName: string; logoUrl?: string; className?: string }): ReactElement {
  return (
    <a href="/" className={cn('gl-brand', props.className)} aria-label={props.storeName}>
      {props.logoUrl ? <img {...densityImage(props.logoUrl, 220)} decoding="async" alt="" className="gl-brand__logo" /> : <span className="gl-brand__name" dir="auto">{props.storeName}</span>}
    </a>
  );
}

function NavRow(props: { items: ReadonlyArray<NavItem>; label: string; align: 'center' | 'start' }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className={cn('gl-nav', `gl-nav--${props.align}`)} aria-label={props.label}>
      <ul className="gl-nav__list">
        {props.items.map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('gl-nav__item', hasMenu && 'gl-nav__item--menu')}>
              <a href={item.url} className="gl-nav__link" aria-haspopup={hasMenu || undefined}>
                <span>{item.label}</span>
                {hasMenu ? <IconChevronDown className="gl-nav__chev" width={14} height={14} /> : null}
              </a>
              {hasMenu ? (
                <div className="gl-nav__panel">
                  {children.length > 0 ? (
                    <ul className="gl-nav__col">
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="gl-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="gl-nav__col">
                      <li className="gl-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={c.url}><a href={c.url} className="gl-nav__sub">{c.label}</a></li>
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
  const { storeName, logoUrl, nav, sticky, logoPosition, onSearchOpen, onCartOpen, onMenuOpen } = props;
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const code = useLocaleCode();
  const { totals } = useCart();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!sticky) return;
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sticky]);

  const search = (
    <button type="button" className="gl-icon-btn gl-header__search" aria-label={glText(code, 'search')} onClick={onSearchOpen}>
      <IconSearch />
      <span className="gl-header__search-label" aria-hidden>{glText(code, 'search')}</span>
    </button>
  );

  return (
    <header className={cn('gl-header', `gl-header--logo-${logoPosition}`, sticky && 'gl-header--sticky', scrolled && 'is-scrolled')}>
      <div className="lib-container gl-header__bar">
        <div className="gl-header__start">
          <button type="button" className="gl-icon-btn gl-only-mobile" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
            <IconMenu />
          </button>
          {logoPosition === 'center' ? search : <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} className="gl-brand--start" />}
        </div>
        {logoPosition === 'center' ? <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} className="gl-brand--center" /> : <span aria-hidden />}
        <div className="gl-header__end">
          {logoPosition === 'start' ? search : null}
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="gl-lang gl-only-desktop" />
          <a href="/account" className="gl-icon-btn gl-only-desktop" aria-label={t('header.account')} title={t('header.account')}>
            <IconUser />
          </a>
          <a href="/wishlist" className="gl-icon-btn gl-only-tablet" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
            <IconHeart />
            {wishlist.count > 0 ? <span className="gl-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
          </a>
          <button type="button" className="gl-icon-btn gl-icon-btn--bag" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
            <IconBag />
            {totals.count > 0 ? <span className="gl-icon-btn__count" aria-hidden>{totals.count}</span> : null}
          </button>
        </div>
      </div>
      <NavRow items={nav} label={t('nav.primary')} align={logoPosition} />
    </header>
  );
}
