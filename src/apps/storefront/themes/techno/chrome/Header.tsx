/**
 * Techno Header — navy, three rows:
 *   support strip  — hotline (tel:) + language switcher (toggle `show_support_line`)
 *   main bar       — menu button · logo · search bar · compare / wishlist / account / cart
 *   category row   — "All categories" mega-menu (click, aria-expanded) + inline nav with dropdowns
 * The main bar + category row are sticky when `sticky_header`; below 1024px the nav collapses into
 * the MobileNav drawer and the search bar becomes an icon that opens the overlay.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useLocaleCode } from '../../../sections-lib';
import { useCompare } from '../components/compare';
import { tkText } from '../components/i18n';
import { IconBolt, IconCart, IconChevronDown, IconCompare, IconGrid, IconHeart, IconMenu, IconPhone, IconSearch, IconUser } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  sticky: boolean;
  showSupportLine: boolean;
  supportPhone: string;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
  onCompareOpen: () => void;
}

function submitSearch(value: string): void {
  const q = value.trim();
  if (q) window.location.assign(`/search?q=${encodeURIComponent(q)}${window.location.search.includes('preview=1') ? '&preview=1' : ''}`);
}

function SearchForm(props: { placeholder: string; label: string }): ReactElement {
  const [value, setValue] = useState('');
  const id = useId();
  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    submitSearch(value);
  };
  return (
    <form className="tk-search" role="search" onSubmit={onSubmit}>
      <label className="lib-sr-only" htmlFor={id}>{props.label}</label>
      <input id={id} className="tk-search__input" type="search" placeholder={props.placeholder} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" />
      <button type="submit" className="tk-search__btn" aria-label={props.label}>
        <IconSearch />
      </button>
    </form>
  );
}

/** "All categories" mega-menu: every nav item as a column (its children/columns as links). */
function MegaMenu(props: { items: ReadonlyArray<NavItem>; label: string; viewAll: string }): ReactElement | null {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (props.items.length === 0) return null;
  return (
    <div className={cn('tk-mega', open && 'is-open')} ref={rootRef}>
      <button type="button" className="tk-mega__btn" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        <IconGrid width={18} height={18} />
        <span>{props.label}</span>
        <IconChevronDown className="tk-mega__chev" />
      </button>
      <div id={panelId} className="tk-mega__panel" hidden={!open}>
        <div className="tk-mega__grid">
          {props.items.map((item) => {
            const children = [...(item.children ?? []), ...(item.columns ?? []).flatMap((c) => c.items)];
            return (
              <div key={`${item.label}-${item.url}`} className="tk-mega__col">
                <a href={item.url} className="tk-mega__title">{item.label}</a>
                {children.length > 0 ? (
                  <ul className="tk-mega__links">
                    {children.slice(0, 7).map((c) => (
                      <li key={c.url}><a href={c.url} className="tk-mega__link">{c.label}</a></li>
                    ))}
                    {children.length > 7 ? <li><a href={item.url} className="tk-mega__link tk-mega__link--more">{props.viewAll}</a></li> : null}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="tk-nav" aria-label={props.label}>
      <ul className="tk-nav__list">
        {props.items.map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('tk-nav__item', hasMenu && 'tk-nav__item--menu')}>
              <a href={item.url} className="tk-nav__link" aria-haspopup={hasMenu || undefined}>
                {item.label}
                {hasMenu ? <IconChevronDown className="tk-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="tk-nav__panel">
                  {children.length > 0 ? (
                    <ul className="tk-nav__col">
                      {children.map((c) => (
                        <li key={c.url}><a href={c.url} className="tk-nav__sub">{c.label}</a></li>
                      ))}
                    </ul>
                  ) : null}
                  {columns.map((col) => (
                    <ul key={col.title} className="tk-nav__col">
                      <li className="tk-nav__col-title">{col.title}</li>
                      {col.items.map((c) => (
                        <li key={c.url}><a href={c.url} className="tk-nav__sub">{c.label}</a></li>
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
  const { storeName, logoUrl, nav, sticky, showSupportLine, supportPhone, onSearchOpen, onCartOpen, onMenuOpen, onCompareOpen } = props;
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const code = useLocaleCode();
  const { totals } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const tel = supportPhone.replace(/[^\d+]/g, '');

  return (
    <div className="tk-header-wrap">
      {showSupportLine ? (
        <div className="tk-topbar">
          <div className="lib-container tk-topbar__inner">
            {supportPhone ? (
              <a href={`tel:${tel}`} className="tk-topbar__phone">
                <IconPhone />
                <span>{tkText(code, 'hotline')}:</span>
                <bdi dir="ltr" className="tk-topbar__number">{supportPhone}</bdi>
              </a>
            ) : <span />}
            <div className="tk-topbar__end">
              <a href="/account" className="tk-topbar__link">{t('header.account')}</a>
              <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="tk-topbar__lang" />
            </div>
          </div>
        </div>
      ) : null}

      <header className={cn('tk-header', sticky && 'tk-header--sticky', scrolled && 'is-scrolled')}>
        <div className="lib-container">
          <div className="tk-header__bar">
            <button type="button" className="tk-icon-btn tk-menu-btn" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
              <IconMenu />
            </button>
            <a href="/" className="tk-brand" aria-label={storeName}>
              {logoUrl ? <img src={logoUrl} alt="" className="tk-brand__logo" /> : (
                <span className="tk-brand__name"><span className="tk-brand__mark" aria-hidden><IconBolt width={14} height={14} /></span>{storeName}</span>
              )}
            </a>
            <SearchForm placeholder={tkText(code, 'searchProducts')} label={t('header.search')} />
            <div className="tk-actions">
              {!showSupportLine ? <LanguageSwitcher ns="sf" locale={locale} onChange={setLocale} label={t('header.changeLanguage')} className="tk-actions__lang" /> : null}
              <button type="button" className="tk-icon-btn tk-icon-btn--mobile-only" aria-label={t('header.search')} onClick={onSearchOpen}>
                <IconSearch />
              </button>
              <button type="button" className="tk-icon-btn tk-icon-btn--desktop" aria-label={`${tkText(code, 'compare')} (${compare.count})`} title={tkText(code, 'compare')} onClick={onCompareOpen}>
                <IconCompare />
                {compare.count > 0 ? <span className="tk-icon-btn__count" aria-hidden>{compare.count}</span> : null}
              </button>
              <a href="/wishlist" className="tk-icon-btn tk-icon-btn--desktop" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
                <IconHeart />
                {wishlist.count > 0 ? <span className="tk-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
              </a>
              <a href="/account" className="tk-icon-btn tk-icon-btn--desktop" aria-label={t('header.account')} title={t('header.account')}>
                <IconUser />
              </a>
              <button type="button" className="tk-icon-btn tk-icon-btn--cart" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
                <IconCart />
                {totals.count > 0 ? <span className="tk-icon-btn__count" aria-hidden>{totals.count}</span> : null}
              </button>
            </div>
          </div>
        </div>
        <div className="tk-header__row">
          <div className="lib-container tk-header__row-inner">
            <MegaMenu items={nav} label={tkText(code, 'allCategories')} viewAll={t('common.viewAll')} />
            <NavBar items={nav} label={t('nav.primary')} />
            <a href="/collections/sale" className="tk-header__deals"><IconBolt /> {tkText(code, 'deals')}</a>
          </div>
        </div>
      </header>
    </div>
  );
}
