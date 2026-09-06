/**
 * Sahra DefaultLayout — global chrome shell: AnnouncementBar → Header → <main> → Footer, plus the
 * CartDrawer, MobileNav and SearchOverlay it controls. Loads the merchant's Google fonts (serif
 * heading + sans body, with Amiri paired for Arabic), applies the `color_scheme` setting to the
 * engine, and projects the card settings as data attributes so `theme.css` can restyle library cards.
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useTheme, useThemeSettings } from '../../../theme-engine/context';
import type { ColorSchemePreference } from '../../../theme-engine/types';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
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

/** Google families we know how to load, with the axis/weights each one needs. */
const GOOGLE_FAMILIES: Record<string, string> = {
  'Playfair Display': 'ital,wght@0,400;0,500;0,600;1,400',
  'Cormorant Garamond': 'ital,wght@0,400;0,500;0,600;1,400',
  Amiri: 'ital,wght@0,400;0,700;1,400',
  'Noto Naskh Arabic': 'wght@400;500;700',
  Cairo: 'wght@400;500;700',
  Inter: 'wght@400;500;600',
  Tajawal: 'wght@400;500;700',
  'IBM Plex Sans Arabic': 'wght@400;500;600',
  Almarai: 'wght@400;700',
};

/** Inject one <link> for the selected Google families (deduped, replaced when settings change). */
function useGoogleFonts(families: ReadonlyArray<unknown>): void {
  const key = [...new Set(families.filter((f): f is string => typeof f === 'string' && f in GOOGLE_FAMILIES))].sort().join('|');
  useEffect(() => {
    if (!key || typeof document === 'undefined') return;
    const id = 'sh-google-fonts';
    const query = key
      .split('|')
      .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:${GOOGLE_FAMILIES[f]}`)
      .join('&');
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

const SCHEMES: ReadonlyArray<ColorSchemePreference> = ['auto', 'light', 'dark'];

/** Push the merchant's `color_scheme` setting into the engine whenever it changes. */
function useColorSchemeSetting(value: unknown): void {
  const { setColorSchemePreference } = useTheme();
  const pref = typeof value === 'string' && (SCHEMES as ReadonlyArray<string>).includes(value) ? (value as ColorSchemePreference) : 'auto';
  useEffect(() => {
    setColorSchemePreference(pref);
  }, [pref, setColorSchemePreference]);
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const settings = useThemeSettings();
  const { store } = useStore();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;

  const headingFont = settings['heading_font'];
  // A Latin serif heading still needs an Arabic serif companion for `ar` headings.
  const arabicSerif = headingFont === 'Playfair Display' || headingFont === 'Cormorant Garamond' ? 'Amiri' : null;
  useGoogleFonts([headingFont, settings['body_font'], arabicSerif]);
  useColorSchemeSetting(settings['color_scheme']);

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const headerStyle = settings['header_style'] === 'classic' ? 'classic' : 'centered';
  const radius = settings['radius'] === 'soft' ? 'soft' : 'sharp';
  const hoverSecond = settings['hover_second_image'] !== false;
  const showRatings = settings['show_ratings'] === true;
  const showQuickAdd = settings['show_quick_add'] !== false;
  const announcementText = typeof settings['announcement_text'] === 'string' ? settings['announcement_text'] : '';
  const messages = settings['show_announcement'] === false ? [] : announcementText ? [announcementText] : (data.announcements ?? []);

  return (
    <ToastProvider>
      <CartProvider>
        <div
          className="sh-root"
          data-header={headerStyle}
          data-radius={radius}
          data-hover-image={hoverSecond ? 'true' : 'false'}
          data-show-ratings={showRatings ? 'true' : 'false'}
          data-show-quick-add={showQuickAdd ? 'true' : 'false'}
        >
          {messages.length > 0 ? <AnnouncementBar messages={messages} url={typeof settings['announcement_url'] === 'string' ? settings['announcement_url'] : ''} /> : null}

          <Header
            storeName={context.store.name}
            {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
            nav={nav}
            style={headerStyle}
            sticky={settings['sticky_header'] !== false}
            onSearchOpen={() => setSearchOpen(true)}
            onCartOpen={() => setCartOpen(true)}
            onMenuOpen={() => setMenuOpen(true)}
          />

          <main id="sf-main" className="sh-main">{children}</main>

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
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
