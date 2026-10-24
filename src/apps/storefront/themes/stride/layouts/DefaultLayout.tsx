/**
 * Stride DefaultLayout — global chrome shell: ticker → Header → <main> → Footer, plus the cart
 * drawer, mobile nav and search overlay it controls. Projects the display-type settings (slant,
 * case) and the ink colour that sits on the accent as data attributes / custom properties so the
 * skin stays token-driven.
 */
import { useLayoutEffect, useState, type CSSProperties, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useTheme } from '../../../theme-engine/context';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { ToastProvider } from '../../../foundation/components/toast/ToastProvider';
import { ProductHeaderChrome } from '../../../state/product-presentation';
import { UiBlock } from '../../../ui-blocks/UiBlocks';
import { useLocaleCode } from '../../../sections-lib';
import { stText } from '../components/i18n';
import { accentFill, inkOn } from '../palette';
import { AnnouncementBar } from '../chrome/AnnouncementBar';
import { CartDrawer } from '../chrome/CartDrawer';
import { Footer } from '../chrome/Footer';
import { Header } from '../chrome/Header';
import { MobileNav } from '../chrome/MobileNav';
import { SearchOverlay } from '../chrome/SearchOverlay';

interface LayoutData {
  announcements?: ReadonlyArray<string>;
  freeShippingThreshold?: number;
  payments?: ReadonlyArray<string>;
  social?: ReadonlyArray<{ label: string; url: string }>;
  year?: number;
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const { settings, colorScheme } = useTheme();
  const { store } = useStore();
  const locale = useLocaleCode();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const announcementText = typeof settings['announcement_text'] === 'string' ? settings['announcement_text'] : '';
  const fromSetting = announcementText.split('|').map((m) => m.trim()).filter(Boolean);
  const messages = settings['show_announcement'] === false ? [] : fromSetting.length > 0 ? fromSetting : (data.announcements ?? []);
  const fill = accentFill(settings, colorScheme);
  const ground = settings['color_scheme'] === 'light' ? 'light' : settings['color_scheme'] === 'auto' ? colorScheme : 'dark';
  const onAccent = inkOn(fill);
  const rootStyle = { '--st-accent-fill': fill, '--st-on-accent': onAccent } as CSSProperties;

  // Drawers and the search overlay portal outside `.st-root`; mirror the accent pair on <html> so
  // they inherit it too. Removed again when the theme unmounts (editor theme switches).
  useLayoutEffect(() => {
    const el = document.documentElement;
    el.style.setProperty('--st-accent-fill', fill);
    el.style.setProperty('--st-on-accent', onAccent);
    return () => {
      el.style.removeProperty('--st-accent-fill');
      el.style.removeProperty('--st-on-accent');
    };
  }, [fill, onAccent]);

  return (
    <ToastProvider>
      <CartProvider>
        <div
          className="st-root"
          style={rootStyle}
          data-ground={ground}
          data-slant={settings['heading_style'] === 'upright' ? 'off' : 'on'}
          data-case={settings['heading_case'] === 'normal' ? 'normal' : 'upper'}
          data-corners={settings['corners'] === 'soft' ? 'soft' : 'sharp'}
          data-show-ratings={settings['show_ratings'] === false ? 'false' : 'true'}
          data-show-quick-add={settings['show_quick_add'] === false ? 'false' : 'true'}
        >
          <ProductHeaderChrome>
            {messages.length > 0 ? (
              <AnnouncementBar
                messages={messages}
                url={typeof settings['announcement_url'] === 'string' ? settings['announcement_url'] : ''}
                motion={settings['ticker_motion'] !== false}
                label={stText(locale, 'announcements')}
                pauseLabel={stText(locale, 'tickerPause')}
                playLabel={stText(locale, 'tickerPlay')}
              />
            ) : null}
            <UiBlock slot="before_header" />
            <Header
              storeName={context.store.name}
              {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
              nav={nav}
              sticky={settings['sticky_header'] !== false}
              onSearchOpen={() => setSearchOpen(true)}
              onCartOpen={() => setCartOpen(true)}
              onMenuOpen={() => setMenuOpen(true)}
            />
            <UiBlock slot="after_header" />
          </ProductHeaderChrome>

          <main id="sf-main" className="st-main">{children}</main>

          <UiBlock slot="before_footer" />
          <Footer
            storeName={context.store.name}
            {...(context.store.description ? { blurb: context.store.description } : {})}
            {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
            groups={footerGroups}
            payments={data.payments ?? []}
            social={data.social ?? []}
            year={data.year ?? new Date().getFullYear()}
          />
          <UiBlock slot="after_footer" />

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} {...(data.freeShippingThreshold !== undefined ? { freeShippingThreshold: data.freeShippingThreshold } : {})} />
          <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} onSearchOpen={() => setSearchOpen(true)} />
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
