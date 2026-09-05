/**
 * Bazaar Header — the marketplace two-row header:
 *   main row     — menu button (mobile) · logo · big search with a category dropdown · wishlist /
 *                  account / cart actions
 *   category bar — "All categories" mega-menu (built from `categories` + `navigation.header`) and
 *                  the store's nav items with hover/focus dropdowns; hidden below 1024px (the
 *                  MobileNav drawer carries the same content on phones).
 * A hairline + soft shadow appear once scrolled.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { NavItem } from '../../../types/navigation';
import type { CategoryCardModel } from '../../../types/catalog';
import { useCart } from '../../../state/cart';
import { useWishlist } from '../../../state/wishlist';
import { useLocale } from '../../../i18n/useLocale';
import { formatMoney } from '../../../utils/format';
import { IconBolt, IconCart, IconChevronDown, IconChevronEnd, IconGrid, IconHeart, IconMenu, IconSearch, IconUser } from './icons';

export interface HeaderProps {
  storeName: string;
  logoUrl?: string;
  nav: ReadonlyArray<NavItem>;
  categories: ReadonlyArray<CategoryCardModel>;
  showCategoryBar: boolean;
  searchPlaceholder: string;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

/** Tiny bilingual helper for chrome copy that has no i18n key. */
const pick = (locale: string, ar: string, en: string): string => (locale.startsWith('ar') ? ar : en);

function submitSearch(value: string, category: string): void {
  const q = value.trim();
  if (!q) return;
  const preview = window.location.search.includes('preview=1') ? '&preview=1' : '';
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  window.location.assign(`/search?q=${encodeURIComponent(q)}${cat}${preview}`);
}

function SearchForm(props: { placeholder: string; label: string; categories: ReadonlyArray<CategoryCardModel>; allLabel: string; categoryLabel: string }): ReactElement {
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('');
  const id = useId();
  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    submitSearch(value, category);
  };
  return (
    <form className="bz-search" role="search" onSubmit={onSubmit}>
      {props.categories.length > 0 ? (
        <div className="bz-search__cat">
          <label className="lib-sr-only" htmlFor={`${id}-cat`}>{props.categoryLabel}</label>
          <select id={`${id}-cat`} className="bz-search__select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{props.allLabel}</option>
            {props.categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <IconChevronDown className="bz-search__chev" />
        </div>
      ) : null}
      <label className="lib-sr-only" htmlFor={`${id}-q`}>{props.label}</label>
      <input id={`${id}-q`} className="bz-search__input" type="search" placeholder={props.placeholder} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" />
      <button type="submit" className="bz-search__btn" aria-label={props.label}>
        <IconSearch />
        <span className="bz-search__btn-label">{props.label}</span>
      </button>
    </form>
  );
}

/** "All categories" button + mega-menu panel (click to toggle, hover to open, ESC / outside click closes). */
function MegaMenu(props: { categories: ReadonlyArray<CategoryCardModel>; nav: ReadonlyArray<NavItem>; label: string; viewAll: string; locale: string }): ReactElement {
  const { categories, nav, label, viewAll, locale } = props;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent): void => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [open]);

  const groups = nav.filter((item) => (item.children?.length ?? 0) > 0 || (item.columns?.length ?? 0) > 0);

  return (
    <div ref={wrap} className={cn('bz-allcats', open && 'is-open')} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="bz-allcats__btn" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <IconGrid />
        <span>{label}</span>
        <IconChevronDown className="bz-allcats__chev" />
      </button>
      <div id={panelId} className="bz-mega" hidden={!open}>
        <div className="bz-mega__inner">
          {categories.length > 0 ? (
            <div className="bz-mega__cats">
              <div className="bz-mega__head">
                <span className="bz-mega__title">{label}</span>
                <a href="/categories" className="bz-mega__all">{viewAll} <IconChevronEnd /></a>
              </div>
              <ul className="bz-mega__grid">
                {categories.map((c) => (
                  <li key={c.id}>
                    <a href={c.url} className="bz-mega__cat">
                      <span className="bz-mega__thumb">{c.image?.src ? <img src={c.image.src} alt="" loading="lazy" /> : <IconGrid />}</span>
                      <span className="bz-mega__cat-text">
                        <span className="bz-mega__cat-name">{c.title}</span>
                        {c.meta ? <span className="bz-mega__cat-meta">{c.meta}</span> : null}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {groups.length > 0 ? (
            <div className="bz-mega__cols">
              {groups.map((item) => {
                const columns = item.columns ?? [];
                const children = item.children ?? [];
                return (
                  <div key={`${item.label}-${item.url}`} className="bz-mega__col">
                    <a href={item.url} className="bz-mega__col-title">{item.label}</a>
                    <ul className="bz-mega__list">
                      {children.map((c) => <li key={c.url}><a href={c.url} className="bz-mega__link">{c.label}</a></li>)}
                      {columns.flatMap((col) => col.items).slice(0, 8).map((c) => <li key={`${col(c)}`}><a href={c.url} className="bz-mega__link">{c.label}</a></li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : categories.length === 0 ? (
            <ul className="bz-mega__list bz-mega__list--flat">
              {nav.map((item) => <li key={`${item.label}-${item.url}`}><a href={item.url} className="bz-mega__link">{item.label}</a></li>)}
              {nav.length === 0 ? <li className="bz-mega__empty">{pick(locale, 'لا توجد تصنيفات بعد', 'No categories yet')}</li> : null}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const col = (c: NavItem): string => `${c.label}-${c.url}`;

function NavBar(props: { items: ReadonlyArray<NavItem>; label: string }): ReactElement | null {
  if (props.items.length === 0) return null;
  return (
    <nav className="bz-nav" aria-label={props.label}>
      <ul className="bz-nav__list">
        {props.items.map((item) => {
          const children = item.children ?? [];
          const columns = item.columns ?? [];
          const hasMenu = children.length > 0 || columns.length > 0;
          return (
            <li key={`${item.label}-${item.url}`} className={cn('bz-nav__item', hasMenu && 'bz-nav__item--menu')}>
              <a href={item.url} className="bz-nav__link" aria-haspopup={hasMenu || undefined}>
                {item.label}
                {hasMenu ? <IconChevronDown className="bz-nav__chev" /> : null}
              </a>
              {hasMenu ? (
                <div className="bz-nav__panel">
                  {children.length > 0 ? (
                    <ul className="bz-nav__col">
                      {children.map((c) => <li key={c.url}><a href={c.url} className="bz-nav__sub">{c.label}</a></li>)}
                    </ul>
                  ) : null}
                  {columns.map((column) => (
                    <ul key={column.title} className="bz-nav__col">
                      <li className="bz-nav__col-title">{column.title}</li>
                      {column.items.map((c) => <li key={c.url}><a href={c.url} className="bz-nav__sub">{c.label}</a></li>)}
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
  const { storeName, logoUrl, nav, categories, showCategoryBar, searchPlaceholder, onSearchOpen, onCartOpen, onMenuOpen } = props;
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { totals } = useCart();
  const wishlist = useWishlist();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const allCategories = pick(locale, 'جميع التصنيفات', 'All categories');

  return (
    <header className={cn('bz-header', scrolled && 'is-scrolled')}>
      <div className="lib-container">
        <div className="bz-header__bar">
          <button type="button" className="bz-icon-btn bz-menu-btn" aria-label={t('nav.openMenu')} onClick={onMenuOpen}>
            <IconMenu />
          </button>

          <a href="/" className="bz-brand" aria-label={storeName}>
            {logoUrl ? <img src={logoUrl} alt="" className="bz-brand__logo" /> : (
              <span className="bz-brand__name"><span className="bz-brand__mark" aria-hidden>{storeName.charAt(0)}</span>{storeName}</span>
            )}
          </a>

          <SearchForm placeholder={searchPlaceholder || t('search.placeholder')} label={t('header.search')} categories={categories} allLabel={allCategories} categoryLabel={t('nav.categories')} />

          <div className="bz-actions">
            <button type="button" className="bz-icon-btn bz-icon-btn--mobile-only" aria-label={t('header.search')} onClick={onSearchOpen}>
              <IconSearch />
            </button>
            <a href="/account" className="bz-icon-btn bz-icon-btn--desktop" aria-label={t('header.account')} title={t('header.account')}>
              <IconUser />
            </a>
            <a href="/wishlist" className="bz-icon-btn bz-icon-btn--desktop" aria-label={t('header.wishlist')} title={t('header.wishlist')}>
              <IconHeart />
              {wishlist.count > 0 ? <span className="bz-icon-btn__count" aria-hidden>{wishlist.count}</span> : null}
            </a>
            <button type="button" className="bz-icon-btn bz-cart-btn" aria-label={t('header.cartWithCount', { count: totals.count })} onClick={onCartOpen}>
              <span className="bz-cart-btn__icon">
                <IconCart />
                {totals.count > 0 ? <span className="bz-icon-btn__count" aria-hidden>{totals.count}</span> : null}
              </span>
              <span className="bz-cart-btn__meta" aria-hidden>
                <span className="bz-cart-btn__label">{t('header.cart')}</span>
                <span className="bz-cart-btn__total">{formatMoney(totals.subtotal, totals.currency, locale)}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {showCategoryBar ? (
        <div className="bz-catbar">
          <div className="lib-container bz-catbar__inner">
            <MegaMenu categories={categories} nav={nav} label={allCategories} viewAll={t('common.viewAll')} locale={locale} />
            <NavBar items={nav} label={t('nav.primary')} />
            <a href="/collections/sale" className="bz-catbar__deals">
              <IconBolt /> {pick(locale, 'عروض اليوم', 'Today’s deals')}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
