/**
 * Karat DefaultLayout — AnnouncementBar → Header → <main> → Footer, plus the CartDrawer, MobileNav
 * and SearchOverlay it controls. The palette, card shape and motion preference are projected as data
 * attributes so `theme.css` can adapt library markup without extra props.
 */
import { useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useTheme } from '../../../theme-engine/context';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { ProductHeaderChrome } from '../../../state/product-presentation';
import { ToastProvider } from '../../../foundation/components/toast/ToastProvider';
import { UiBlock } from '../../../ui-blocks/UiBlocks';
import { useLocaleCode } from '../../../sections-lib';
import { useConciergePhone } from '../components/concierge';
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

function choice(value: unknown, allowed: ReadonlyArray<string>, fallback: string): string {
  return typeof value === 'string' && allowed.includes(value) ? value : fallback;
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const { settings } = useTheme();
  const { store } = useStore();
  const locale = useLocaleCode();
  const phone = useConciergePhone();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const announcementText = typeof settings['announcement_text'] === 'string' ? settings['announcement_text'].trim() : '';
  const messages = settings['show_announcement'] === false ? [] : announcementText ? [announcementText] : (data.announcements ?? []);
  const announcementUrl = typeof settings['announcement_url'] === 'string' ? settings['announcement_url'] : '';

  return (
    <ToastProvider>
      <CartProvider>
        <div
          className="kr-root"
          data-palette={choice(settings['palette'], ['emerald', 'onyx', 'ivory'], 'emerald')}
          data-card-ratio={choice(settings['card_ratio'], ['portrait', 'square'], 'portrait')}
          data-motion={choice(settings['motion'], ['subtle', 'none'], 'subtle')}
          data-corners={choice(settings['corners'], ['square', 'soft'], 'square')}
        >
          <ProductHeaderChrome>
            {messages.length > 0 ? <AnnouncementBar messages={messages} label={locale.startsWith('ar') ? 'إعلان' : 'Announcement'} {...(announcementUrl ? { url: announcementUrl } : {})} /> : null}
            <UiBlock slot="before_header" />
            <Header
              storeName={context.store.name}
              {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
              nav={nav}
              sticky={settings['sticky_header'] !== false}
              conciergePhone={phone}
              showConcierge={settings['show_header_concierge'] !== false}
              onSearchOpen={() => setSearchOpen(true)}
              onCartOpen={() => setCartOpen(true)}
              onMenuOpen={() => setMenuOpen(true)}
            />
            <UiBlock slot="after_header" />
          </ProductHeaderChrome>

          <main id="sf-main" className="kr-main">{children}</main>

          <UiBlock slot="before_footer" />
          <Footer
            storeName={context.store.name}
            {...(context.store.description ? { blurb: context.store.description } : {})}
            {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
            phone={phone}
            groups={footerGroups}
            payments={data.payments ?? []}
            social={data.social ?? []}
            year={data.year ?? new Date().getFullYear()}
          />
          <UiBlock slot="after_footer" />

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} {...(data.freeShippingThreshold !== undefined ? { freeShippingThreshold: data.freeShippingThreshold } : {})} />
          <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} onSearchOpen={() => setSearchOpen(true)} conciergePhone={phone} />
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
