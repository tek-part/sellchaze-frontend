/**
 * Header — Hearth's warm sticky chrome: brand → primary room nav → utility actions (search,
 * account, boards, cart). Room-first IA (docs/themes/theme-03/08-navigation). Reads nav from the
 * engine context. Utility actions are real links (no-JS baseline); drawers/overlays are layered on
 * in Phase 4 via the optional callbacks.
 */
import type React from 'react';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../../../../shared/utils/cn';
import { LanguageSwitcher, isActiveRoute, isBranchActive, useMenuNavigation } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useTranslation } from 'react-i18next';
import type { NavItem } from '../../../types/navigation';
import { Container } from '../components/Container';
import { CartIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../components/icons';

export interface HeaderProps {
  storeName: string;
  logo?: string;
  nav: ReadonlyArray<NavItem>;
  sticky?: boolean;
  showSearch?: boolean;
  showBoards?: boolean;
  cartCount?: number;
  onSearchOpen?: () => void;
  onCartOpen?: () => void;
  onMenuOpen?: () => void;
}

export function Header(props: HeaderProps): ReactElement {
  const {
    storeName,
    logo,
    nav,
    sticky = true,
    showSearch = true,
    showBoards = true,
    cartCount = 0,
    onSearchOpen,
    onCartOpen,
    onMenuOpen,
  } = props;

  const { pathname } = useLocation();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  // Behaviour (hover intent, Escape, click-outside, focus-leave, close-on-navigate) is shared;
  // everything below the hook is Hearth's own warm markup and styling.
  const menu = useMenuNavigation(pathname);

  return (
    <header className={cn('hh-header', sticky && 'hh-header--sticky')}>
      <Container className="hh-header__bar">
        <button
          type="button"
          className="hh-header__menu"
          aria-label="Open menu"
          onClick={onMenuOpen}
        >
          <MenuIcon />
        </button>

        <a href="/" className="hh-header__brand" aria-label={`${storeName} — home`}>
          {logo ? (
            <img className="hh-header__logo" src={logo} alt={storeName} />
          ) : (
            <span className="hh-header__wordmark">{storeName}</span>
          )}
        </a>

        <nav className="hh-header__nav" aria-label={t('nav.primary')} ref={menu.containerRef as React.RefObject<HTMLElement>}>
          <ul className="hh-header__nav-list">
            {nav.map((item) => {
              const panelItems = item.children ?? [];
              const panelColumns = item.columns ?? [];
              const hasPanel = panelItems.length > 0 || panelColumns.length > 0;
              const active = isBranchActive(pathname, item);
              const panelId = `hh-menu-${item.label.replace(/\W+/g, '-').toLowerCase()}`;

              return (
                <li
                  key={item.url}
                  className="hh-header__nav-item"
                  {...(hasPanel ? menu.hoverProps(item.label) : {})}
                >
                  <a
                    href={item.url}
                    className="hh-header__nav-link"
                    {...(active ? { 'aria-current': 'page' as const, 'data-active': 'true' } : {})}
                    {...(hasPanel
                      ? {
                          'aria-expanded': menu.isOpen(item.label),
                          'aria-controls': panelId,
                          'aria-haspopup': true as const,
                          onKeyDown: (e: React.KeyboardEvent) => menu.triggerKeyDown(item.label, e),
                        }
                      : {})}
                  >
                    {item.label}
                  </a>

                  {hasPanel ? (
                    <div
                      id={panelId}
                      className="hh-megamenu"
                      data-open={menu.isOpen(item.label) ? 'true' : 'false'}
                      {...(menu.isOpen(item.label) ? {} : { hidden: true })}
                    >
                      <div className="hh-megamenu__inner">
                        {panelItems.length > 0 ? (
                          <div className="hh-megamenu__col">
                            <h3 className="hh-megamenu__title">{t('nav.browse')}</h3>
                            <ul className="hh-megamenu__list">
                              {panelItems.map((child) => (
                                <li key={child.url}>
                                  <a
                                    href={child.url}
                                    className="hh-megamenu__link"
                                    {...(isActiveRoute(pathname, child.url) ? { 'aria-current': 'page' as const } : {})}
                                  >
                                    {child.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {panelColumns.map((col) => (
                          <div key={col.title} className="hh-megamenu__col">
                            <h3 className="hh-megamenu__title">{col.title}</h3>
                            <ul className="hh-megamenu__list">
                              {col.items.map((child) => (
                                <li key={child.url}>
                                  <a
                                    href={child.url}
                                    className="hh-megamenu__link"
                                    {...(isActiveRoute(pathname, child.url) ? { 'aria-current': 'page' as const } : {})}
                                  >
                                    {child.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hh-header__actions">
          <LanguageSwitcher
            ns="hh"
            locale={locale}
            onChange={setLocale}
            label={t('header.changeLanguage')}
            className="hh-header__lang"
          />
          {showSearch ? (
            <button
              type="button"
              className="hh-header__action"
              aria-label="Search"
              onClick={onSearchOpen}
            >
              <SearchIcon />
            </button>
          ) : null}
          <a href="/account" className="hh-header__action" aria-label="Account">
            <UserIcon />
          </a>
          {showBoards ? (
            <a href="/boards" className="hh-header__action" aria-label="Saved boards">
              <HeartIcon />
            </a>
          ) : null}
          <button
            type="button"
            className="hh-header__action hh-header__cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
            onClick={onCartOpen}
          >
            <CartIcon />
            {cartCount > 0 ? (
              <span className="hh-header__cart-count" aria-hidden>
                {cartCount}
              </span>
            ) : null}
          </button>
        </div>
      </Container>
    </header>
  );
}
