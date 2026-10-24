/**
 * Karat Header — a centred house mark:
 *   bar  — [menu · search · concierge]  ·  logo / store name  ·  [language · account · wishlist · bag]
 *   nav  — centred, letter-spaced links with quiet dropdown panels (desktop, ≥1024px)
 * Sticky when `sticky_header`; it tightens slightly once the page scrolls. Below 1024px the nav
 * moves into the MobileNav drawer.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import { densityImage } from '../../../foundation/media/responsive';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useLocaleCode } from '../../../sections-lib';
import { krText, whatsappHref } from '../components/i18n';
import { IconBag, IconChevronDown, IconHeart, IconMenu, IconSearch, IconUser, IconWhatsapp } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  sticky: boolean;
  conciergePhone: string;
  showConcierge: boolean;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

export function Brand(props: { storeName: string; logoUrl?: string; className?: string }): ReactElement {
  return (
    <a href="/" className={cn('kr-brand', props.className)} aria-label={props.storeName}>
      {props.logoUrl ? (
        <img {...densityImage(props.logoUrl, 220)} decoding="async" alt="" className="kr-brand__logo" />
      ) : (
        <span className="kr-brand__name">{props.storeName}</span>
      )}
    </a>
  );
}

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="kr-nav" aria-label={props.label}>
      <ul className="kr-nav__list">
        {props.items.slice(0, 8).map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('kr-nav__item', hasMenu && 'kr-nav__item--menu')}>
              <a href={item.url} className="kr-nav__link" aria-haspopup={hasMenu || undefined}>
                <span>{item.label}</span>
                {hasMenu ? <IconChevronDown className="kr-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="kr-nav__panel">
                  {children.length > 0 ? (
                    <ul className="kr-nav__col">
                      {children.map((c) => (
                        <li key={`${c.label}-${c.url}`}><a href={c.url} className="kr-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="kr-nav__col">
                      <li className="kr-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={`${c.label}-${c.url}`}><a href={c.url} className="kr-nav__sub">{c.label}</a></li>
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
  const { storeName, logoUrl, nav, sticky, conciergePhone, showConcierge, onSearchOpen, onCartOpen, onMenuOpen } = props;
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const code = useLocaleCode();
  const { totals } = useCart();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const wa = showConcierge ? whatsappHref(conciergePhone) : '';

  return (
    <header className={cn('kr-header', sticky && 'kr-header--sticky', scrolled && 'is-scrolled')}>
      <div className="lib-container kr-header__bar">
        <div className="kr-header__start">
          <button type="button" className="kr-icon-btn kr-header__menu" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
            <IconMenu />
          </button>
          <button type="button" className="kr-icon-btn kr-header__search" aria-label={t('header.search')} onClick={onSearchOpen}>
            <IconSearch />
            <span className="kr-header__search-label" aria-hidden>{t('header.search')}</span>
          </button>
          {wa ? (
            <a href={wa} className="kr-header__concierge" target="_blank" rel="noopener noreferrer">
              <IconWhatsapp width={16} height={16} />
              <span>{krText(code, 'concierge')}</span>
            </a>
          ) : null}
        </div>
        <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} className="kr-header__brand" />
        <div className="kr-header__end">
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="kr-header__lang" />
          <a href="/account" className="kr-icon-btn kr-icon-btn--desktop" aria-label={t('header.account')} title={t('header.account')}>
            <IconUser />
          </a>
          <a href="/wishlist" className="kr-icon-btn kr-icon-btn--wide" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
            <IconHeart />
            {wishlist.count > 0 ? <span className="kr-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
          </a>
          <button type="button" className="kr-icon-btn" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
            <IconBag />
            {totals.count > 0 ? <span className="kr-icon-btn__count" aria-hidden>{totals.count}</span> : null}
          </button>
        </div>
      </div>
      <div className="kr-header__navrow">
        <div className="lib-container">
          <NavBar items={nav} label={t('nav.primary')} />
        </div>
      </div>
    </header>
  );
}
