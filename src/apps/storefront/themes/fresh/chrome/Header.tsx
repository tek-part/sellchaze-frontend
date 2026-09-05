/**
 * Fresh Header — a grocery-app header in three rows:
 *   promise  — delivery-time promise strip (translatable `delivery_promise` setting) with a leaf mark
 *   bar      — menu button (mobile) · brand · big pill search · language · account · wishlist · basket
 *   aisles   — category row (desktop) with hover/focus dropdowns for nested items
 * Sticky by default; a soft shadow appears once scrolled. Everything collapses to the MobileNav
 * drawer and the bottom tab bar below 1024px.
 */
import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { formatMoney } from '../../../utils/format';
import { frText } from './text';
import { IconBasket, IconChevronDown, IconClock, IconGrid, IconHeart, IconLeaf, IconMenu, IconSearch, IconUser } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  /** Resolved (per-locale) delivery promise; empty hides the strip. */
  promise: string;
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
    <form className="fr-search" role="search" onSubmit={onSubmit}>
      <label className="lib-sr-only" htmlFor="fr-search-input">{props.label}</label>
      <span className="fr-search__icon" aria-hidden><IconSearch width={18} height={18} /></span>
      <input id="fr-search-input" className="fr-search__input" type="search" placeholder={props.placeholder} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" />
      <button type="submit" className="fr-search__btn">{props.label}</button>
    </form>
  );
}

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string; allLabel: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="fr-nav" aria-label={props.label}>
      <ul className="fr-nav__list">
        <li className="fr-nav__item fr-nav__item--all">
          <a href="/categories" className="fr-nav__link fr-nav__link--all"><IconGrid width={18} height={18} /> {props.allLabel}</a>
        </li>
        {props.items.map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('fr-nav__item', hasMenu && 'fr-nav__item--menu')}>
              <a href={item.url} className="fr-nav__link" aria-haspopup={hasMenu || undefined}>
                {item.label}
                {hasMenu ? <IconChevronDown className="fr-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="fr-nav__panel">
                  {children.length > 0 ? (
                    <ul className="fr-nav__col">
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="fr-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="fr-nav__col">
                      <li className="fr-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={c.url}><a href={c.url} className="fr-nav__sub">{c.label}</a></li>
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
  const { storeName, logoUrl, nav, promise, sticky, onSearchOpen, onCartOpen, onMenuOpen } = props;
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
    <header className={cn('fr-header', sticky && 'fr-header--sticky', scrolled && 'is-scrolled')}>
      {promise ? (
        <div className="fr-promise" role="region" aria-label={frText(locale, 'deliveryPromise')}>
          <div className="lib-container fr-promise__inner">
            <span className="fr-promise__mark" aria-hidden><IconLeaf /></span>
            <span className="fr-promise__text"><IconClock className="fr-promise__clock" /> {promise}</span>
          </div>
        </div>
      ) : null}

      <div className="fr-header__bar-wrap">
        <div className="lib-container">
          <div className="fr-header__bar">
            <button type="button" className="fr-icon-btn fr-menu-btn" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
              <IconMenu />
            </button>

            <a href="/" className="fr-brand" aria-label={storeName}>
              {logoUrl ? <img src={logoUrl} alt="" className="fr-brand__logo" /> : (
                <>
                  <span className="fr-brand__mark" aria-hidden><IconLeaf width={20} height={20} /></span>
                  <span className="fr-brand__name">{storeName}</span>
                </>
              )}
            </a>

            <SearchForm placeholder={frText(locale, 'searchPlaceholder')} label={t('header.search')} />

            <div className="fr-actions">
              <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="fr-actions__lang" />
              <button type="button" className="fr-icon-btn fr-icon-btn--mobile-only" aria-label={t('header.search')} onClick={onSearchOpen}>
                <IconSearch />
              </button>
              <a href="/account" className="fr-icon-btn fr-icon-btn--desktop" aria-label={t('header.account')} title={t('header.account')}>
                <IconUser />
              </a>
              <a href="/wishlist" className="fr-icon-btn fr-icon-btn--desktop" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
                <IconHeart />
                {wishlist.count > 0 ? <span className="fr-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
              </a>
              <button type="button" className="fr-basket-btn" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
                <span className="fr-basket-btn__icon">
                  <IconBasket />
                  {totals.count > 0 ? <span className="fr-icon-btn__count" aria-hidden>{totals.count}</span> : null}
                </span>
                <span className="fr-basket-btn__text" aria-hidden>
                  <span className="fr-basket-btn__label">{t('header.cart')}</span>
                  <span className="fr-basket-btn__total">{formatMoney(totals.subtotal, totals.currency, locale)}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fr-header__row">
        <div className="lib-container">
          <NavBar items={nav} label={t('nav.primary')} allLabel={frText(locale, 'allCategories')} />
        </div>
      </div>
    </header>
  );
}
