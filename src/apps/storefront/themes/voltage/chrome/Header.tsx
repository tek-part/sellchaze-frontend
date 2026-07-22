/**
 * Voltage Header — dark frosted sticky bar: bolt wordmark, mono uppercase nav, technical action
 * icons, tabular cart count. Reads the shared cart store for the count. Voltage's own chrome.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { IconButton } from '../components/IconButton';
import { IconBolt, IconCart, IconHeart, IconMenu, IconSearch, IconUser } from '../components/icons';
import type { NavItem } from '../../../types/navigation';
import { useCart } from '../../../state/cart';
import { LanguageSwitcher } from '../../../shared-ui';
import { useLocale } from '../../../i18n/useLocale';
import { useTranslation } from 'react-i18next';

export interface HeaderProps {
  storeName: string;
  nav: ReadonlyArray<NavItem>;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  onMenuOpen: () => void;
}

export function Header(props: HeaderProps): ReactElement {
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  const { storeName, nav, onSearchOpen, onCartOpen, onMenuOpen } = props;
  const { totals } = useCart();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (url: string): boolean => url !== '/' && pathname.startsWith(url);

  return (
    <header className={cn('vlt-header', scrolled && 'vlt-header--scrolled')}>
      <Container>
        <div className="vlt-header__bar">
          <IconButton label="Open menu" className="vlt-header__menu-btn" onClick={onMenuOpen}>
            <IconMenu />
          </IconButton>
          <a href="/" className="vlt-header__brand">
            <span className="vlt-header__brand-bolt" aria-hidden><IconBolt width={18} height={18} /></span>
            {storeName}
          </a>
          <nav className="vlt-header__nav" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.label} href={item.url} className="vlt-nav-link" aria-current={isActive(item.url) ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="vlt-header__actions">
            <LanguageSwitcher
              ns="vlt"
              locale={locale}
              onChange={setLocale}
              label={t('header.changeLanguage')}
              className="vlt-header__lang"
            />
            <IconButton label="Search" onClick={onSearchOpen}><IconSearch /></IconButton>
            <a href="/account" className="vlt-icon-btn" aria-label="Account" title="Account"><IconUser /></a>
            <a href="/wishlist" className="vlt-icon-btn" aria-label="Wishlist" title="Wishlist"><IconHeart /></a>
            <IconButton label={`Cart, ${totals.count} items`} className="vlt-header__cart" onClick={onCartOpen}>
              <IconCart />
              {totals.count > 0 ? <span className="vlt-header__cart-count vlt-num" aria-hidden>{totals.count}</span> : null}
            </IconButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
