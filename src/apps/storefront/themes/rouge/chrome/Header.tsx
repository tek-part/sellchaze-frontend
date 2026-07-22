/**
 * Rouge Header — a frosted porcelain sticky bar: a didone wordmark with a script flourish, an
 * elegant nav with a gilt underline on hover, soft round action icons, and a rouge cart pill count.
 * Reads the shared cart store for the count. Rouge's own chrome — no other theme reused.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../../../../shared/utils/cn';
import { Container } from '../components/Container';
import { IconButton } from '../components/IconButton';
import { IconBag, IconHeart, IconMenu, IconSearch, IconUser } from '../components/icons';
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
    <header className={cn('rge-header', scrolled && 'rge-header--scrolled')}>
      <Container>
        <div className="rge-header__bar">
          <IconButton label="Open menu" className="rge-header__menu-btn" onClick={onMenuOpen}>
            <IconMenu />
          </IconButton>
          <a href="/" className="rge-header__brand" aria-label={storeName}>
            {storeName}
          </a>
          <nav className="rge-header__nav" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.label} href={item.url} className="rge-nav-link" aria-current={isActive(item.url) ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="rge-header__actions">
            <LanguageSwitcher
              ns="rge"
              locale={locale}
              onChange={setLocale}
              label={t('header.changeLanguage')}
              className="rge-header__lang"
            />
            <IconButton label="Search" onClick={onSearchOpen}><IconSearch /></IconButton>
            <a href="/account" className="rge-icon-btn rge-header__hide-sm" aria-label="Account" title="Account"><IconUser /></a>
            <a href="/wishlist" className="rge-icon-btn rge-header__hide-sm" aria-label="Wishlist" title="Wishlist"><IconHeart /></a>
            <IconButton label={`Bag, ${totals.count} items`} className="rge-header__cart" onClick={onCartOpen}>
              <IconBag />
              {totals.count > 0 ? <span className="rge-header__cart-count rge-num" aria-hidden>{totals.count}</span> : null}
            </IconButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
