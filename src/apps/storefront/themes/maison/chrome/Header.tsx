/**
 * Maison Header — calm editorial masthead.
 *   centered (default): search · centred wordmark · language / account / wishlist / bag, with the
 *                       menu on its own row underneath (desktop).
 *   classic:            wordmark at the start, menu inline, actions at the end.
 * Sub-menus open on hover and on keyboard focus (`:focus-within`); below 1024px the menu collapses
 * into the MobileNav drawer. Sticky with a soft hairline once the page scrolls.
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
import { maiText } from '../components/i18n';
import { IconBag, IconChevronDown, IconHeart, IconMenu, IconSearch, IconUser } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  sticky: boolean;
  layout: 'centered' | 'classic';
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

export function Brand(props: { storeName: string; logoUrl?: string; className?: string }): ReactElement {
  return (
    <a href="/" className={cn('mai-brand', props.className)} aria-label={props.storeName}>
      {props.logoUrl ? (
        <img {...densityImage(props.logoUrl, 220)} decoding="async" alt="" className="mai-brand__logo" />
      ) : (
        <span className="mai-brand__name">{props.storeName}</span>
      )}
    </a>
  );
}

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="mai-nav" aria-label={props.label}>
      <ul className="mai-nav__list">
        {props.items.map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('mai-nav__item', hasMenu && 'mai-nav__item--menu')}>
              <a href={item.url} className="mai-nav__link" aria-haspopup={hasMenu || undefined}>
                <span>{item.label}</span>
                {hasMenu ? <IconChevronDown className="mai-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="mai-nav__panel">
                  {children.length > 0 ? (
                    <ul className="mai-nav__col">
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="mai-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="mai-nav__col">
                      <li className="mai-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={c.url}><a href={c.url} className="mai-nav__sub">{c.label}</a></li>
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
  const { storeName, logoUrl, nav, sticky, layout, onSearchOpen, onCartOpen, onMenuOpen } = props;
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

  const centered = layout === 'centered';

  return (
    <header className={cn('mai-header', `mai-header--${layout}`, sticky && 'mai-header--sticky', scrolled && 'is-scrolled')}>
      <div className="lib-container mai-header__bar">
        <div className="mai-header__start">
          <button type="button" className="mai-icon-btn mai-menu-btn" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
            <IconMenu />
          </button>
          {centered ? (
            <button type="button" className="mai-search-pill" onClick={onSearchOpen} aria-label={t('header.search')}>
              <IconSearch width={18} height={18} />
              <span className="mai-search-pill__text">{maiText(code, 'searchPlaceholder')}</span>
            </button>
          ) : (
            <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} />
          )}
        </div>

        {centered ? <Brand storeName={storeName} {...(logoUrl ? { logoUrl } : {})} className="mai-brand--center" /> : <NavBar items={nav} label={t('nav.primary')} />}

        <div className="mai-header__end">
          <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="mai-lang" />
          <button type="button" className={cn('mai-icon-btn', centered && 'mai-icon-btn--compact-only')} aria-label={t('header.search')} onClick={onSearchOpen}>
            <IconSearch />
          </button>
          <a href="/account" className="mai-icon-btn mai-icon-btn--desktop" aria-label={t('header.account')} title={t('header.account')}>
            <IconUser />
          </a>
          <a href="/wishlist" className="mai-icon-btn mai-icon-btn--desktop" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
            <IconHeart />
            {wishlist.count > 0 ? <span className="mai-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
          </a>
          <button type="button" className="mai-icon-btn mai-icon-btn--bag" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
            <IconBag />
            {totals.count > 0 ? <span className="mai-icon-btn__count" aria-hidden>{totals.count}</span> : null}
          </button>
        </div>
      </div>
      {centered && nav.length > 0 ? (
        <div className="mai-header__row">
          <div className="lib-container">
            <NavBar items={nav} label={t('nav.primary')} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
