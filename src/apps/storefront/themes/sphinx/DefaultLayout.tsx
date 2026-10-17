import { StorePaymentMarks } from '../../shared-ui/PaymentMarks';
import { ProductHeaderChrome } from '../../state/product-presentation';
import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useInRouterContext, useLocation } from 'react-router-dom';
import type { LayoutRenderProps } from '../../theme-engine/rendering';
import type { NavItem, FooterGroup } from '../../types/navigation';
import { useThemeSettings, useThemeTokens } from '../../theme-engine/context';
import { CartProvider, useCart } from '../../state/cart';
import { useStore } from '../../state/store-context';
import { ToastProvider } from '../../foundation/components/toast/ToastProvider';
import { Drawer } from '../../foundation/components/Drawer';
import { UiBlock } from '../../ui-blocks/UiBlocks';
import { useLocale } from '../../i18n/useLocale';
import { withSessionParams } from '../../pages/NavigationInterceptor';
import { BagIcon, SearchIcon, HomeIcon, GridIcon, MoreIcon } from './icons';
import { SphinxCart } from './CartDrawer';
import { SphinxNewsletter } from './Newsletter';

interface SphinxLayoutData {
  categoryNavigation?: ReadonlyArray<NavItem>;
  allCategoryNavigation?: ReadonlyArray<NavItem>;
  headerPageNavigation?: ReadonlyArray<NavItem>;
  managedHeaderNavigation?: ReadonlyArray<NavItem> | null;
  sphinxFooterNavigation?: ReadonlyArray<FooterGroup>;
  year?: number;
}

function RoutedChrome(props: LayoutRenderProps): ReactElement {
  const { pathname } = useLocation();
  return <Chrome {...props} checkout={pathname === '/checkout'} />;
}

function ChromeBridge(props: LayoutRenderProps): ReactElement {
  const routed = useInRouterContext();
  return routed ? <RoutedChrome {...props} /> : <Chrome {...props} />;
}

function Chrome({ context, children, checkout = false }: LayoutRenderProps & { checkout?: boolean }): ReactElement {
  const settings = useThemeSettings();
  const tokens = useThemeTokens();
  const { store } = useStore();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { totals } = useCart();
  const ar = locale === 'ar';
  const text = (a: string, e: string): string => ar ? a : e;
  const data = context.data as SphinxLayoutData;
  const categories = data.categoryNavigation ?? [];
  const pages = data.headerPageNavigation ?? [];
  const navigation = data.managedHeaderNavigation ?? [...categories, ...pages];
  const footerGroups = data.sphinxFooterNavigation ?? [];
  const [cartOpen, setCartOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState('');
  const fonts = [...new Set([settings['heading_font'], settings['body_font']].filter((font): font is string => typeof font === 'string' && ['Raleway', 'Cairo', 'IBM Plex Sans Arabic'].includes(font)))].sort().join('|');
  useEffect(() => {
    if (!fonts) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fonts.split('|').map((font) => `family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;500;600;700`).join('&')}&display=swap`;
    document.head.appendChild(link);
    return () => link.remove();
  }, [fonts]);

  const brand = <a href="/" className="sph-brand" aria-label={store.name}>{store.logoUrl ? <img src={store.logoUrl} alt="" /> : <span>{store.name}</span>}</a>;
  if (checkout) return <div className="sph-root sph-checkout" style={{ '--font': tokens.typography.fontSans, '--heading': tokens.typography.fontSerif, '--font-arabic': tokens.typography.fontSerif } as CSSProperties}>
    <header className="sph-checkout__header sph-container">{brand}</header>
    <main id="sf-main">{children}</main>
    <footer className="sph-checkout__footer sph-container"><nav aria-label={text('صفحات المتجر', 'Store pages')}>{footerGroups.flatMap((group) => group.links).map((link) => <a key={link.url} href={link.url}>{link.label}</a>)}</nav></footer>
  </div>;
  return <div className="sph-root" style={{ '--font': tokens.typography.fontSans, '--heading': tokens.typography.fontSerif, '--font-arabic': tokens.typography.fontSerif } as CSSProperties}>
    {settings['show_announcement'] !== false && settings['announcement_text'] ? <div className="sph-announcement">{String(settings['announcement_text'])}</div> : null}
    <ProductHeaderChrome><UiBlock slot="before_header" />
    <header className="sph-header">
      <div className="sph-container sph-header__row">
        {brand}
        <form className="sph-search" action="/search" role="search" onSubmit={(event) => { event.preventDefault(); if (query.trim()) window.location.assign(withSessionParams(`/search?q=${encodeURIComponent(query.trim())}`, window.location.search)); }}><label className="lib-sr-only" htmlFor="sph-search">{t('header.search')}</label><input id="sph-search" name="q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text('ابحث عن المنتجات', 'Search for products')} /><button type="submit" aria-label={t('header.search')}><SearchIcon /></button></form>
        <button type="button" className="sph-bag" onClick={() => setCartOpen(true)} aria-label={`${t('cart.title')} (${totals.count})`}><BagIcon /><span>{totals.count}</span></button>
      </div>
      <div className="sph-header__navigation">{navigation.length ? <nav className="sph-header__nav sph-container" aria-label={text('القائمة الرئيسية', 'Main navigation')}><ul>{navigation.map((item) => <li key={`${item.url}-${item.label}`}><a href={item.url}>{item.label}</a>{item.children?.length ? <ul>{item.children.map((child) => <li key={child.url}><a href={child.url}>{child.label}</a></li>)}</ul> : null}</li>)}</ul></nav> : <div className="sph-header__nav" />}</div>
    </header>
    <UiBlock slot="after_header" /></ProductHeaderChrome>
    <main id="sf-main">{children}</main>
    <UiBlock slot="before_footer" />
    <SphinxNewsletter />
    <footer className="sph-footer"><div className="sph-container sph-footer__grid"><div className="sph-footer__brand">{brand}{context.store.description ? <p>{context.store.description}</p> : null}{settings['address'] ? <p>{String(settings['address'])}</p> : null}{store.phone ? <a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{store.phone}</a> : null}{store.email ? <a href={`mailto:${store.email}`}>{store.email}</a> : null}</div>
      {(data.allCategoryNavigation ?? []).length ? <details open className="sph-footer__links"><summary>{text('الأقسام', 'Categories')}</summary><nav aria-label={text('أقسام المتجر', 'Store categories')}><ul>{data.allCategoryNavigation?.map((item) => <li key={item.url}><a href={item.url}>{item.label}</a></li>)}</ul></nav></details> : null}
      {footerGroups.map((group) => <details open className="sph-footer__links" key={group.title}><summary>{group.title}</summary><nav aria-label={group.title}><ul>{group.links.map((link) => <li key={`${link.url}-${link.label}`}><a href={link.url}>{link.label}</a></li>)}</ul></nav></details>)}
    </div><div className="sph-container sph-footer__legal"><StorePaymentMarks label={text('وسائل الدفع المقبولة', 'Accepted payment methods')} />© {data.year ?? 2026} {store.name}</div></footer>
    <UiBlock slot="after_footer" />
    <nav className="sph-mobile-nav" aria-label={text('التنقل السريع', 'Quick navigation')}><a href="/"><HomeIcon /><span>{text('الرئيسية', 'Home')}</span></a><a href="/categories"><GridIcon /><span>{text('الأقسام', 'Categories')}</span></a><button type="button" onClick={() => setCartOpen(true)}><BagIcon /><span>{text('السلة', 'Cart')}{totals.count ? ` (${totals.count})` : ''}</span></button><button type="button" onClick={() => setMoreOpen(true)}><MoreIcon /><span>{text('المزيد', 'More')}</span></button></nav>
    <SphinxCart open={cartOpen} close={() => setCartOpen(false)} />
    <Drawer open={moreOpen} onClose={() => setMoreOpen(false)} title={text('المزيد', 'More')} className="sph-more"><div className="sf-overlay__body"><a href="/shop" onClick={() => setMoreOpen(false)}>{t('nav.allProducts')}</a>{navigation.map((item) => <a key={`${item.url}-${item.label}`} href={item.url} onClick={() => setMoreOpen(false)}>{item.label}</a>)}{footerGroups.flatMap((group) => group.links).filter((item, index, list) => list.findIndex((other) => other.url === item.url) === index && !navigation.some((other) => other.url === item.url)).map((item) => <a key={item.url} href={item.url} onClick={() => setMoreOpen(false)}>{item.label}</a>)}</div></Drawer>
  </div>;
}

export function SphinxLayout(props: LayoutRenderProps): ReactElement {
  return <ToastProvider><CartProvider><ChromeBridge {...props} /></CartProvider></ToastProvider>;
}

