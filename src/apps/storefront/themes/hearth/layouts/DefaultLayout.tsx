/**
 * DefaultLayout — Hearth's global chrome shell. Provides the shared cart state, then renders the
 * AnnouncementBar → Header → <main> (the page) → Footer, plus the CartDrawer, MobileNav and
 * SearchOverlay it controls. Reads everything from the engine `context` (store, navigation, data),
 * so wiring stays data-driven and theme-agnostic. Overlays are keyboard- and scroll-locked.
 */
import { useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider, useCart } from '../../../state/cart';
import { Header } from '../chrome/Header';
import { Footer } from '../chrome/Footer';
import { CartDrawer } from '../chrome/CartDrawer';
import { MobileNav } from '../chrome/MobileNav';
import { SearchOverlay } from '../chrome/SearchOverlay';
import { AnnouncementBar } from '../chrome/AnnouncementBar';

interface LayoutData {
  freeShippingThreshold?: number;
  announcements?: ReadonlyArray<string>;
  social?: ReadonlyArray<{ label: string; url: string }>;
  payments?: ReadonlyArray<string>;
  year?: number;
}

function LayoutInner(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const layoutData = context.data as LayoutData;
  const announcements = layoutData.announcements ?? [];
  const { totals } = useCart();

  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (value: string): void => {
    const q = value.trim();
    setSearchOpen(false);
    if (typeof window !== 'undefined' && q) window.location.assign(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="hh-root">
      <a href="#hh-main" className="hh-skip-link">
        Skip to content
      </a>

      {announcements.length > 0 ? <AnnouncementBar messages={announcements} dismissible /> : null}

      <Header
        storeName={context.store.name}
        {...(context.store.logo ? { logo: context.store.logo } : {})}
        nav={nav}
        cartCount={totals.count}
        onCartOpen={() => setCartOpen(true)}
        onMenuOpen={() => setMenuOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
      />

      <main id="hh-main" className="hh-main">
        {children}
      </main>

      <Footer
        storeName={context.store.name}
        {...(context.store.description ? { blurb: context.store.description } : {})}
        groups={footerGroups}
        {...(layoutData.social ? { social: layoutData.social } : {})}
        {...(layoutData.payments ? { payments: layoutData.payments } : {})}
        {...(layoutData.year ? { year: layoutData.year } : {})}
        regionNote={`Ships worldwide · Prices in ${context.store.currency}`}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        {...(layoutData.freeShippingThreshold ? { freeShippingThreshold: layoutData.freeShippingThreshold } : {})}
      />
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        query={query}
        onQueryChange={setQuery}
        onSubmit={submitSearch}
      />
    </div>
  );
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  return (
    <CartProvider>
      <LayoutInner {...props} />
    </CartProvider>
  );
}
