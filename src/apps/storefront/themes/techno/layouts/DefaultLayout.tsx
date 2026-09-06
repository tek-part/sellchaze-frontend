/**
 * Techno DefaultLayout — global chrome shell: AnnouncementBar → Header → <main> → Footer, plus the
 * CartDrawer, CompareDrawer, MobileNav and SearchOverlay it controls. Loads the merchant's Google
 * fonts, applies the `color_scheme` setting to the engine, and projects card toggles as data
 * attributes so `theme.css` can restyle library cards.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useTheme } from '../../../theme-engine/context';
import type { ColorSchemePreference } from '../../../theme-engine/types';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { ToastProvider } from '../../../foundation/components/toast/ToastProvider';
import { CompareProvider } from '../components/compare';
import { AnnouncementBar } from '../chrome/AnnouncementBar';
import { CartDrawer } from '../chrome/CartDrawer';
import { CompareDrawer } from '../chrome/CompareDrawer';
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

const GOOGLE_FAMILIES = new Set(['Inter', 'IBM Plex Sans Arabic', 'Rubik', 'Cairo', 'Tajawal', 'Almarai']);

/** Inject one <link> for the selected Google families (deduped, replaced when settings change). */
function useGoogleFonts(families: ReadonlyArray<unknown>): void {
  const key = families.filter((f): f is string => typeof f === 'string' && GOOGLE_FAMILIES.has(f)).sort().join('|');
  useEffect(() => {
    if (!key || typeof document === 'undefined') return;
    const id = 'tk-google-fonts';
    const query = key.split('|').map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&');
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

function isSchemePref(v: unknown): v is ColorSchemePreference {
  return v === 'auto' || v === 'light' || v === 'dark';
}

/**
 * Apply the merchant's `color_scheme` setting to the engine. An explicit light/dark always wins; the
 * `auto` default is only re-applied when the merchant changes the setting back to it, so an
 * `?scheme=` preview override survives the initial mount.
 */
function useColorSchemeSetting(value: unknown, apply: (pref: ColorSchemePreference) => void): void {
  const pref: ColorSchemePreference = isSchemePref(value) ? value : 'auto';
  const previous = useRef<ColorSchemePreference | null>(null);
  useEffect(() => {
    const first = previous.current === null;
    if (previous.current === pref) return;
    previous.current = pref;
    if (first && pref === 'auto') return;
    apply(pref);
  }, [pref, apply]);
}

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const { settings, setColorSchemePreference } = useTheme();
  const { store } = useStore();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;

  useGoogleFonts([settings['heading_font'], settings['body_font']]);
  useColorSchemeSetting(settings['color_scheme'], setColorSchemePreference);

  const [cartOpen, setCartOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const showRatings = settings['show_ratings'] !== false;
  const showQuickAdd = settings['show_quick_add'] !== false;
  const supportPhone = typeof settings['support_phone'] === 'string' ? settings['support_phone'].trim() : '';
  const announcementText = typeof settings['announcement_text'] === 'string' ? settings['announcement_text'] : '';
  const messages = settings['show_announcement'] === false ? [] : announcementText ? [announcementText] : (data.announcements ?? []);

  return (
    <ToastProvider>
      <CartProvider>
        <CompareProvider>
          <div
            className="tk-root"
            data-show-ratings={showRatings ? 'true' : 'false'}
            data-show-quick-add={showQuickAdd ? 'true' : 'false'}
          >
            {messages.length > 0 ? <AnnouncementBar messages={messages} url={typeof settings['announcement_url'] === 'string' ? settings['announcement_url'] : ''} /> : null}

            <Header
              storeName={context.store.name}
              {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
              nav={nav}
              sticky={settings['sticky_header'] !== false}
              showSupportLine={settings['show_support_line'] !== false}
              supportPhone={supportPhone}
              onSearchOpen={() => setSearchOpen(true)}
              onCartOpen={() => setCartOpen(true)}
              onMenuOpen={() => setMenuOpen(true)}
              onCompareOpen={() => setCompareOpen(true)}
            />

            <main id="sf-main" className="tk-main">{children}</main>

            <Footer
              storeName={context.store.name}
              {...(context.store.description ? { blurb: context.store.description } : {})}
              {...(store.logoUrl ? { logoUrl: store.logoUrl } : {})}
              {...(supportPhone ? { supportPhone } : {})}
              groups={footerGroups}
              payments={data.payments ?? []}
              social={data.social ?? []}
              year={data.year ?? 2026}
            />

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} {...(data.freeShippingThreshold ? { freeShippingThreshold: data.freeShippingThreshold } : {})} />
            <CompareDrawer open={compareOpen} onClose={() => setCompareOpen(false)} />
            <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} onSearchOpen={() => setSearchOpen(true)} onCompareOpen={() => setCompareOpen(true)} {...(supportPhone ? { supportPhone } : {})} />
            <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
          </div>
        </CompareProvider>
      </CartProvider>
    </ToastProvider>
  );
}
