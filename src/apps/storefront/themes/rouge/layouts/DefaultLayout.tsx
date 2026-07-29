/**
 * Rouge DefaultLayout — the theme's global chrome shell. Wraps pages in the shared Cart provider
 * (storefront infrastructure) and renders Rouge's AnnouncementBar → Header → <main> → Footer, plus a
 * soft mobile nav panel, a slide-in CartDrawer, and a SearchOverlay. Reads the engine context;
 * announcements come from the shared data contract.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { IconButton } from '../components/IconButton';
import { Eyebrow } from '../components/Typography';
import { IconClose } from '../components/icons';
import { ToastProvider } from '../components/toast/ToastProvider';
import { AnnouncementBar } from '../chrome/AnnouncementBar';
import { Header } from '../chrome/Header';
import { Footer } from '../chrome/Footer';
import { CartDrawer } from '../chrome/CartDrawer';
import { SearchOverlay } from '../chrome/SearchOverlay';

function announcementsOf(data: Readonly<Record<string, unknown>>): ReadonlyArray<string> {
  const raw = data['announcements'];
  return Array.isArray(raw) ? raw.filter((m): m is string => typeof m === 'string') : [];
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { t } = useTranslation();
  const { context, children } = props;
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const announcements = announcementsOf(context.data);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <CartProvider>
     <ToastProvider>
      {announcements.length > 0 ? <AnnouncementBar messages={announcements} /> : null}

      <Header
        storeName={context.store.name}
        nav={nav}
        onSearchOpen={() => setSearchOpen(true)}
        onCartOpen={() => setCartOpen(true)}
        onMenuOpen={() => setMenuOpen(true)}
      />

      <main id="sf-main">{children}</main>

      <Footer
        storeName={context.store.name}
        {...(context.store.description ? { blurb: context.store.description } : {})}
        groups={footerGroups}
      />

      {menuOpen ? (
        <div className="rge-mobilenav" role="dialog" aria-modal="true" aria-label={t('nav.menu')}>
          <div className="rge-mobilenav__head">
            <Eyebrow>{t('nav.menu')}</Eyebrow>
            <IconButton label={t('nav.closeMenu')} onClick={() => setMenuOpen(false)}>
              <IconClose />
            </IconButton>
          </div>
          <nav aria-label={t('nav.mobileNav')}>
            {nav.map((item) => (
              <a key={item.label} href={item.url} className="rge-mobilenav__link" onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
     </ToastProvider>
    </CartProvider>
  );
}
