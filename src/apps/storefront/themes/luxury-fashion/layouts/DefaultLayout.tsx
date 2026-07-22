/**
 * DefaultLayout — the theme's global chrome shell. Wraps every page in the Toast + Cart providers,
 * then renders AnnouncementBar → Header → <main> (the page) → Footer, plus the CartDrawer, MobileNav
 * and SearchOverlay it controls. Reads everything from the engine `context` (store, navigation, data),
 * so it stays data-driven and theme-agnostic in wiring. §32.8.
 */
import { useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { ToastProvider } from '../components/toast/ToastProvider';
import { SearchOverlay } from '../components/SearchOverlay';
import { AnnouncementBar } from '../chrome/AnnouncementBar';
import { CartDrawer } from '../chrome/CartDrawer';
import { Footer } from '../chrome/Footer';
import { Header } from '../chrome/Header';
import { MobileNav } from '../chrome/MobileNav';

interface LayoutData {
  announcements?: ReadonlyArray<string>;
  freeShippingThreshold?: number;
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const layoutData = context.data as LayoutData;

  // The engine render context is rebuilt per page and only carries store name +
  // currency, so the logo is read from the store context instead — the same
  // source that receives `logo_url` from the API for real stores.
  const { store } = useStore();

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (value: string): void => {
    const q = value.trim();
    if (q) window.location.assign(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <ToastProvider>
      <CartProvider>
        {layoutData.announcements && layoutData.announcements.length > 0 ? (
          <AnnouncementBar messages={layoutData.announcements} dismissible />
        ) : null}

        <Header
          storeName={context.store.name}
          {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
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

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          {...(layoutData.freeShippingThreshold ? { freeShippingThreshold: layoutData.freeShippingThreshold } : {})}
        />
        <MobileNav
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={nav}
          onSearchOpen={() => setSearchOpen(true)}
        />
        <SearchOverlay
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          query={query}
          onQueryChange={setQuery}
          onSubmit={submitSearch}
          placeholder="Search for pieces, categories…"
        />
      </CartProvider>
    </ToastProvider>
  );
}
