/**
 * Fresh DefaultLayout — global chrome shell: AnnouncementBar → Header (with the delivery-promise
 * strip) → <main> → Footer, plus the CartDrawer, MobileNav, SearchOverlay and the sticky bottom
 * MobileTabBar it controls. Loads the merchant's Google fonts and projects the card settings as
 * data attributes so `theme.css` and the Fresh product card can react to them.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useThemeSettings } from '../../../theme-engine/context';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { ToastProvider } from '../../../foundation/components/toast/ToastProvider';
import { AnnouncementBar } from '../chrome/AnnouncementBar';
import { CartDrawer } from '../chrome/CartDrawer';
import { Footer } from '../chrome/Footer';
import { Header } from '../chrome/Header';
import { MobileNav } from '../chrome/MobileNav';
import { MobileTabBar } from '../chrome/MobileTabBar';
import { SearchOverlay } from '../chrome/SearchOverlay';

interface LayoutData {
  announcements?: ReadonlyArray<string>;
  freeShippingThreshold?: number;
  payments?: ReadonlyArray<string>;
  social?: ReadonlyArray<{ label: string; url: string }>;
  year?: number;
}

const GOOGLE_FAMILIES = new Set(['Cairo', 'Nunito', 'Tajawal', 'Almarai', 'IBM Plex Sans Arabic', 'Rubik', 'Poppins']);

/** Inject one <link> for the selected Google families (deduped, replaced when settings change). */
function useGoogleFonts(families: ReadonlyArray<unknown>): void {
  const key = families.filter((f): f is string => typeof f === 'string' && GOOGLE_FAMILIES.has(f)).sort().join('|');
  useEffect(() => {
    if (!key || typeof document === 'undefined') return;
    const id = 'fr-google-fonts';
    const query = key.split('|').map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;600;700;800`).join('&');
    const href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }, [key]);
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const settings = useThemeSettings();
  const { store } = useStore();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;

  useGoogleFonts([settings['heading_font'], settings['body_font']]);

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const showRatings = settings['show_ratings'] !== false;
  const showQuickAdd = settings['show_quick_add'] !== false;
  const showUnitLabel = settings['show_unit_label'] !== false;
  const showTabBar = settings['show_mobile_tabbar'] !== false;
  const promise = typeof settings['delivery_promise'] === 'string' ? settings['delivery_promise'].trim() : '';
  const announcementText = typeof settings['announcement_text'] === 'string' ? settings['announcement_text'] : '';
  const messages = settings['show_announcement'] === false ? [] : announcementText ? [announcementText] : (data.announcements ?? []);

  return (
    <ToastProvider>
      <CartProvider>
        <div
          className="fr-root"
          data-show-ratings={showRatings ? 'true' : 'false'}
          data-show-quick-add={showQuickAdd ? 'true' : 'false'}
          data-show-unit-label={showUnitLabel ? 'true' : 'false'}
          data-tabbar={showTabBar ? 'true' : 'false'}
        >
          {messages.length > 0 ? <AnnouncementBar messages={messages} /> : null}

          <Header
            storeName={context.store.name}
            {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
            nav={nav}
            promise={promise}
            sticky={settings['sticky_header'] !== false}
            onSearchOpen={() => setSearchOpen(true)}
            onCartOpen={() => setCartOpen(true)}
            onMenuOpen={() => setMenuOpen(true)}
          />

          <main id="sf-main" className="fr-main">{children}</main>

          <Footer
            storeName={context.store.name}
            {...(context.store.description ? { blurb: context.store.description } : {})}
            {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
            groups={footerGroups}
            payments={data.payments ?? []}
            social={data.social ?? []}
            year={data.year ?? 2026}
          />

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} {...(data.freeShippingThreshold ? { freeShippingThreshold: data.freeShippingThreshold } : {})} />
          <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} onSearchOpen={() => setSearchOpen(true)} />
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
          {showTabBar ? <MobileTabBar onCategoriesOpen={() => setMenuOpen(true)} onCartOpen={() => setCartOpen(true)} /> : null}
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
