/**
 * Voltage DefaultLayout — the theme's global chrome shell. Wraps every page in the Toast + Cart +
 * Compare providers, then renders Header → <main id="sf-main"> → Footer, plus the overlays it owns:
 * CartDrawer, SearchOverlay, MobileNav and the CompareTray. Header controls open state (no route
 * navigation for cart/search). `#sf-main` is the shared shell's skip-link + RouteAnnouncer target, so
 * the id is a contract. Reads everything from the engine `context`. Voltage's own chrome.
 */
import { useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { CompareProvider } from '../state/compare-context';
import { ToastProvider } from '../components/toast/ToastProvider';
import { Header } from '../chrome/Header';
import { Footer } from '../chrome/Footer';
import { CartDrawer } from '../chrome/CartDrawer';
import { SearchOverlay } from '../chrome/SearchOverlay';
import { MobileNav } from '../chrome/MobileNav';
import { CompareTray } from '../chrome/CompareTray';

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <CartProvider>
        <CompareProvider>
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

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
          <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} onSearchOpen={() => setSearchOpen(true)} />
          <CompareTray />
        </CompareProvider>
      </CartProvider>
    </ToastProvider>
  );
}
