/**
 * Header — global top chrome: centred/inline brand, primary Navigation, and thin action icons
 * (search, account, wishlist, bag with count). Sticky; a hairline base + faint shadow appear once
 * scrolled. Collapses the nav to a menu button below the lg breakpoint. §32.8.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { IconButton } from '../components/IconButton';
import { IconBag, IconHeart, IconMenu, IconSearch, IconUser } from '../components/icons';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { Navigation } from './Navigation';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useTranslation } from 'react-i18next';

export interface HeaderProps {
  storeName: string;
  /** Store logo. When present it replaces the wordmark; falls back to storeName. */
  logoUrl?: string;
  homeUrl?: string;
  nav: ReadonlyArray<NavItem>;
  accountUrl?: string;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

export function Header(props: HeaderProps): ReactElement {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  const { storeName, logoUrl, homeUrl = '/', nav, accountUrl = '/account', onSearchOpen, onCartOpen, onMenuOpen } = props;
  const { totals } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={cn('sf-header', scrolled && 'sf-header--scrolled')}>
      <Container>
        <div className="sf-header__bar">
          <IconButton label="Open menu" className="sf-header__menu-btn" onClick={onMenuOpen}>
            <IconMenu />
          </IconButton>

          {/*
            The link keeps the store name as its accessible label either way, so
            the logo carries an empty alt — the name would otherwise be
            announced twice.
          */}
          <a href={homeUrl} className="sf-header__brand" aria-label={storeName}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="sf-header__logo" />
            ) : (
              storeName
            )}
          </a>

          <Navigation items={nav} />

          <div className="sf-header__actions">
            <LanguageSwitcher
              ns="sf"
              locale={locale}
              onChange={setLocale}
              label={t('header.changeLanguage')}
              className="sf-header__lang"
            />
            <IconButton label="Search" onClick={onSearchOpen}>
              <IconSearch />
            </IconButton>
            <a href={accountUrl} className="sf-icon-btn" aria-label="Account" title="Account">
              <IconUser />
            </a>
            <a href="/wishlist" className="sf-icon-btn" aria-label="Wishlist" title="Wishlist">
              <IconHeart aria-hidden />
            </a>
            <IconButton label={`Cart, ${totals.count} items`} className="sf-header__cart" onClick={onCartOpen}>
              <IconBag />
              {totals.count > 0 ? <span className="sf-header__cart-count" aria-hidden>{totals.count}</span> : null}
            </IconButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
