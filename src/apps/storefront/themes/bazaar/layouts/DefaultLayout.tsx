/**
 * Bazaar DefaultLayout — global chrome shell: top utility bar (AnnouncementBar) → two-row Header
 * with category bar → <main> → Footer, plus the CartDrawer, MobileNav and SearchOverlay it controls.
 * Loads the merchant's Google fonts and projects the card settings as data attributes so
 * `theme.css` can restyle library cards (compact / comfortable, ratings, quick add, discount badge).
 */
import { useEffect, useState, type ReactElement } from 'react';
import type { LayoutRenderProps } from '../../../theme-engine/rendering';
import { useThemeSettings } from '../../../theme-engine/context';
import type { FooterGroup, NavItem } from '../../../types/navigation';
import { CartProvider } from '../../../state/cart';
import { useStore } from '../../../state/store-context';
import { useSectionData } from '../../../sections-lib';
import { ToastProvider } from '../../luxury-fashion/components/toast/ToastProvider';
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

const GOOGLE_FAMILIES = new Set(['Cairo', 'Tajawal', 'IBM Plex Sans Arabic', 'Almarai', 'Inter', 'Poppins']);

/** Inject one <link> for the selected Google families (deduped, replaced when settings change). */
function useGoogleFonts(families: ReadonlyArray<unknown>): void {
  const key = families.filter((f): f is string => typeof f === 'string' && GOOGLE_FAMILIES.has(f)).sort().join('|');
  useEffect(() => {
    if (!key || typeof document === 'undefined') return;
    const id = 'bz-google-fonts';
    const query = key.split('|').map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;500;600;700;800`).join('&');
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

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

export function DefaultLayout(props: LayoutRenderProps): ReactElement {
  const { context, children } = props;
  const settings = useThemeSettings();
  const { store } = useStore();
  const nav = (context.navigation.header as ReadonlyArray<NavItem>) ?? [];
  const footerGroups = (context.navigation.footer as ReadonlyArray<FooterGroup>) ?? [];
  const data = context.data as LayoutData;
  const sectionData = useSectionData(context);
  const categories = sectionData.categories(16);

  useGoogleFonts([settings['heading_font'], settings['body_font']]);

  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const cardStyle = str(settings['card_style'], 'compact');
  const showRatings = settings['show_ratings'] !== false;
  const showQuickAdd = settings['show_quick_add'] !== false;
  const showDiscount = settings['show_discount_badge'] !== false;
  const announcementText = str(settings['announcement_text']);
  const messages = announcementText ? [announcementText] : (data.announcements ?? []);
  const showTopBar = settings['show_top_bar'] !== false;
  const logoUrl = store.logoUrl;

  return (
    <ToastProvider>
      <CartProvider>
        <div
          className="bz-root"
          data-card-style={cardStyle}
          data-show-ratings={showRatings ? 'true' : 'false'}
          data-show-quick-add={showQuickAdd ? 'true' : 'false'}
          data-show-discount-badge={showDiscount ? 'true' : 'false'}
        >
          <div className={settings['sticky_header'] !== false ? 'bz-chrome bz-chrome--sticky' : 'bz-chrome'}>
            {showTopBar ? <AnnouncementBar messages={messages} url={str(settings['announcement_url'])} /> : null}
            <Header
              storeName={context.store.name}
              {...(logoUrl ? { logoUrl } : {})}
              nav={nav}
              categories={categories}
              showCategoryBar={settings['show_category_bar'] !== false}
              searchPlaceholder={str(settings['search_placeholder'])}
              onSearchOpen={() => setSearchOpen(true)}
              onCartOpen={() => setCartOpen(true)}
              onMenuOpen={() => setMenuOpen(true)}
            />
          </div>

          <main id="sf-main" className="bz-main">{children}</main>

          <Footer
            storeName={context.store.name}
            {...(context.store.description ? { blurb: context.store.description } : {})}
            {...(logoUrl ? { logoUrl } : {})}
            groups={footerGroups}
            categories={categories.slice(0, 6)}
            payments={data.payments ?? []}
            social={data.social ?? []}
            year={data.year ?? 2026}
          />

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} {...(data.freeShippingThreshold ? { freeShippingThreshold: data.freeShippingThreshold } : {})} />
          <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} items={nav} categories={categories} onSearchOpen={() => setSearchOpen(true)} />
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
