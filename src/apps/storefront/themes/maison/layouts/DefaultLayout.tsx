/**
 * Maison DefaultLayout — global chrome shell: AnnouncementBar → Header → <main> → Footer, plus the
 * CartDrawer, MobileNav and SearchOverlay it controls. Applies the merchant's `color_scheme`, and
 * projects the card toggles (`card_ratio`, `show_material_line`, ratings, quick add) as data
 * attributes so `theme.css` restyles every card — the theme's own and the library's — consistently.
 * Fonts are the self-hosted families loaded by the storefront document; nothing is fetched here.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useTheme } from '../../../theme-engine/context';
import type { ColorSchemePreference } from '../../../theme-engine/types';
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

interface LayoutData {
  announcements?: ReadonlyArray<string>;
  freeShippingThreshold?: number;
  payments?: ReadonlyArray<string>;
  social?: ReadonlyArray<{ label: string; url: string }>;
  year?: number;
}

function isSchemePref(v: unknown): v is ColorSchemePreference {
  return v === 'auto' || v === 'light' || v === 'dark';
}

/**
 * Apply the merchant's `color_scheme`. On first mount an explicit `?scheme=` preview override (or
 * the `auto` value) is left alone; later changes from the customizer always apply.
 */
function useColorSchemeSetting(value: unknown, apply: (pref: ColorSchemePreference) => void): void {
  const pref: ColorSchemePreference = isSchemePref(value) ? value : 'light';
  const previous = useRef<ColorSchemePreference | null>(null);
  useEffect(() => {
    const first = previous.current === null;
    if (previous.current === pref) return;
    previous.current = pref;
    if (first && (pref === 'auto' || (typeof window !== 'undefined' && /[?&]scheme=/.test(window.location.search)))) return;
    apply(pref);
  }, [pref, apply]);
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const { settings, setColorSchemePreference } = useTheme();
  const { store } = useStore();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;

  useColorSchemeSetting(settings['color_scheme'], setColorSchemePreference);

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const announcementText = str(settings['announcement_text']);
  const messages = settings['show_announcement'] === false ? [] : announcementText ? [announcementText] : (data.announcements ?? []);
  const ratio = settings['card_ratio'] === 'square' || settings['card_ratio'] === 'tall' ? settings['card_ratio'] : 'portrait';

  return (
    <ToastProvider>
      <CartProvider>
        <div
          className="mai-root"
          data-card-ratio={ratio}
          data-show-material={settings['show_material_line'] === false ? 'false' : 'true'}
          data-show-ratings={settings['show_ratings'] === false ? 'false' : 'true'}
          data-show-quick-add={settings['show_quick_add'] === false ? 'false' : 'true'}
        >
          <ProductHeaderChrome>
            {messages.length > 0 ? <AnnouncementBar messages={messages} url={str(settings['announcement_url'])} /> : null}
            <UiBlock slot="before_header" />
            <Header
              storeName={context.store.name}
              {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
              nav={nav}
              sticky={settings['sticky_header'] !== false}
              layout={settings['header_layout'] === 'classic' ? 'classic' : 'centered'}
              onSearchOpen={() => setSearchOpen(true)}
              onCartOpen={() => setCartOpen(true)}
              onMenuOpen={() => setMenuOpen(true)}
            />
            <UiBlock slot="after_header" />
          </ProductHeaderChrome>

          <main id="sf-main" className="mai-main">{children}</main>

          <UiBlock slot="before_footer" />
          <Footer
            storeName={context.store.name}
            {...(context.store.description ? { blurb: context.store.description } : {})}
            {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
            statement={str(settings['footer_statement'])}
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
