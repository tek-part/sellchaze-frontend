/**
 * Glow DefaultLayout — chrome shell: AnnouncementBar → Header → <main> → Footer, plus the CartDrawer,
 * MobileNav and SearchOverlay it controls. Projects the palette tone (`data-tone`) so `theme.css`
 * can set `color-scheme` for native controls, and the card ratio as a custom property. Fonts are
 * the platform's self-hosted families, so nothing is fetched from a font CDN.
 */
import { useState, type CSSProperties, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useTheme } from '../../../theme-engine/context';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { ProductHeaderChrome } from '../../../state/product-presentation';
import { UiBlock } from '../../../ui-blocks/UiBlocks';
import { ToastProvider } from '../../../foundation/components/toast/ToastProvider';
import { AnnouncementBar } from '../chrome/AnnouncementBar';
import { CartDrawer } from '../chrome/CartDrawer';
import { Footer } from '../chrome/Footer';
import { Header } from '../chrome/Header';
import { MobileNav } from '../chrome/MobileNav';
import { SearchOverlay } from '../chrome/SearchOverlay';
import { glowPalette } from '../create-tokens';

interface LayoutData {
  announcements?: ReadonlyArray<string>;
  freeShippingThreshold?: number;
  payments?: ReadonlyArray<string>;
  social?: ReadonlyArray<{ label: string; url: string }>;
  year?: number;
}

/** Announcement lines: the merchant's text (split on "|") wins over the store's announcements. */
export function announcementMessages(enabled: unknown, text: unknown, fallback: ReadonlyArray<string> = []): ReadonlyArray<string> {
  if (enabled === false) return [];
  const own = typeof text === 'string' ? text.split('|').map((m) => m.trim()).filter(Boolean) : [];
  return own.length > 0 ? own : fallback;
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const { settings, colorScheme } = useTheme();
  const { store } = useStore();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const palette = glowPalette(settings);
  const tone = palette === 'night' || (settings['auto_dark'] === true && colorScheme === 'dark') ? 'dark' : 'light';
  const messages = announcementMessages(settings['show_announcement'], settings['announcement_text'], data.announcements ?? []);
  const style = { '--lib-card-ratio': settings['card_ratio'] === 'square' ? '1 / 1' : '4 / 5' } as CSSProperties;

  return (
    <ToastProvider>
      <CartProvider>
        <div className="gl-root" data-palette={palette} data-tone={tone} style={style}>
          <ProductHeaderChrome>
            {messages.length > 0 ? <AnnouncementBar messages={messages} url={typeof settings['announcement_url'] === 'string' ? settings['announcement_url'] : ''} /> : null}
            <UiBlock slot="before_header" />
            <Header
              storeName={context.store.name}
              {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
              nav={nav}
              sticky={settings['sticky_header'] !== false}
              logoPosition={settings['logo_position'] === 'start' ? 'start' : 'center'}
              onSearchOpen={() => setSearchOpen(true)}
              onCartOpen={() => setCartOpen(true)}
              onMenuOpen={() => setMenuOpen(true)}
            />
            <UiBlock slot="after_header" />
          </ProductHeaderChrome>

          <main id="sf-main" className="gl-main">{children}</main>

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
