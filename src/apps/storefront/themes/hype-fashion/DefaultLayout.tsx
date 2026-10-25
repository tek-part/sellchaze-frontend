import { densityImage } from '../../foundation/media/responsive';
import { useEffect, useState, type ReactElement } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import type { LayoutRenderProps } from '../../theme-engine/rendering';
import type { NavItem, FooterGroup } from '../../types/navigation';
import { useThemeSettings, useReducedMotion } from '../../theme-engine/context';
import { CartProvider, useCart } from '../../state/cart';
import { useWishlist } from '../../state/wishlist';
import { useStore } from '../../state/store-context';
import { useLocale } from '../../i18n/useLocale';
import { ProductHeaderChrome } from '../../state/product-presentation';
import { ToastProvider } from '../../foundation/components/toast/ToastProvider';
import { Drawer } from '../../foundation/components/Drawer';
import { CurrencySwitcher } from '../../foundation/components/CurrencySwitcher';
import { StorePaymentMarks } from '../../shared-ui/PaymentMarks';
import { UiBlock } from '../../ui-blocks/UiBlocks';
import { HypeCart } from '../hype-perfumes/CartDrawer';
import { HypeIcon } from '../hype-perfumes/icons';

interface NavigationData { categoryNavigation?: ReadonlyArray<NavItem>; headerPageNavigation?: ReadonlyArray<NavItem>; managedHeaderNavigation?: ReadonlyArray<NavItem> | null; sphinxFooterNavigation?: ReadonlyArray<FooterGroup>; social?: ReadonlyArray<{ label: string; url: string }>; year?: number }
function Routed(props: LayoutRenderProps): ReactElement { return <Chrome {...props} path={useLocation().pathname} />; }
function Bridge(props: LayoutRenderProps): ReactElement { return useInRouterContext() ? <Routed {...props} /> : <Chrome {...props} />; }
function Chrome({ context, children, path = '/' }: LayoutRenderProps & { path?: string }): ReactElement {
  const { store } = useStore(); const { locale, setLocale } = useLocale(); const { totals } = useCart(); const wishlist = useWishlist(); const settings = useThemeSettings(); const reduced = useReducedMotion();
  const ar = locale === 'ar'; const text = (a: string, e: string): string => ar ? a : e; const checkout = path === '/checkout'; const data = context.data as NavigationData;
  const nav = data.managedHeaderNavigation ?? [...data.categoryNavigation ?? [], ...data.headerPageNavigation ?? []]; const footer = data.sphinxFooterNavigation ?? [];
  const [menu, setMenu] = useState(false); const [cart, setCart] = useState(false);
  useEffect(() => { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700;800&family=Newsreader:wght@300;400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap'; document.head.appendChild(link); return () => link.remove(); }, []);
  useEffect(() => { setMenu(false); setCart(false); }, [path]);
  const brand = <a href="/" className="hpf-brand" aria-label={store.name}>{store.logoUrl ? <img {...densityImage(store.logoUrl, 240)} decoding="async" alt={store.name} /> : <strong>{store.name}</strong>}</a>;
  return <div className={`hyp-root hpf-root${checkout ? ' hpf-checkout' : ''}`} data-reduced-motion={reduced}>
    <ProductHeaderChrome><UiBlock slot="before_header" /><header className="hpf-header"><button className="hpf-menu-trigger" type="button" onClick={() => setMenu(true)} aria-label={text('افتح القائمة', 'Open menu')}><HypeIcon kind="menu" /></button>{brand}<nav className="hpf-navigation" aria-label={text('القائمة الرئيسية', 'Main navigation')}>{nav.slice(0, 6).map(item => <div key={`${item.url}-${item.label}`}><a href={item.url}>{item.label}</a>{item.children?.length ? <div className="hpf-submenu">{item.children.map(child => <a key={child.url} href={child.url}>{child.label}</a>)}</div> : null}</div>)}{nav.length > 6 ? <details><summary>{text('المزيد', 'More')}</summary><div className="hpf-submenu">{nav.slice(6).map(item => <a key={item.url} href={item.url}>{item.label}</a>)}</div></details> : null}</nav><div className="hpf-header-actions"><a href="/search" aria-label={text('البحث', 'Search')}><HypeIcon kind="search" /></a><a className="hpf-desktop-wishlist" href="/wishlist" aria-label={`${text('المفضلة', 'Wishlist')} (${wishlist.count})`}><HypeIcon kind="heart" /><span>{wishlist.count}</span></a>{store.supportedLocales.includes('ar') && store.supportedLocales.includes('en') ? <button className="hpf-language" type="button" onClick={() => setLocale(ar ? 'en' : 'ar')} aria-label={text('تغيير اللغة', 'Change language')}>{ar ? 'EN' : 'ع'}</button> : null}<CurrencySwitcher className="hpf-currency" /><button type="button" onClick={() => setCart(true)} aria-label={`${text('السلة', 'Cart')} (${totals.count})`}><HypeIcon kind="cart" /><span>{totals.count}</span></button></div></header><UiBlock slot="after_header" /></ProductHeaderChrome>
    <main id="sf-main">{children}</main><UiBlock slot="before_footer" />
    <footer className="hpf-footer"><div className="hpf-footer-grid"><div>{brand}{settings['address'] || store.merchantInformation?.address ? <p>{String(settings['address'] || store.merchantInformation?.address)}</p> : null}{store.email ? <a href={`mailto:${store.email}`}>{store.email}</a> : null}{store.phone ? <a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{store.phone}</a> : null}{data.social?.length ? <nav aria-label={text('روابط التواصل الاجتماعي', 'Social links')}>{data.social.map(item => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>)}</nav> : null}</div>{footer.map(group => <nav key={group.title} aria-label={group.title}><h3>{group.title}</h3>{group.links.map(item => <a key={item.url} href={item.url}>{item.label}</a>)}</nav>)}</div><div className="hpf-footer-bottom"><StorePaymentMarks label={text('وسائل الدفع المقبولة', 'Accepted payment methods')} /><p>© {data.year ?? new Date().getFullYear()} {store.name} · <a href="https://sellchaze.com/">Sellchaze</a></p></div></footer>
    {!checkout ? <nav className="hpf-mobile-navigation" aria-label={text('اختصارات المتجر', 'Store shortcuts')}><a href="/shop" aria-current={path === '/shop' ? 'page' : undefined}><HypeIcon kind="bag" />{text('المتجر', 'Shop')}</a><a href="/wishlist" aria-current={path === '/wishlist' ? 'page' : undefined}><HypeIcon kind="heart" />{text('المفضلة', 'Wishlist')}<span>{wishlist.count}</span></a><button type="button" onClick={() => setCart(true)}><HypeIcon kind="cart" />{text('السلة', 'Cart')}<span>{totals.count}</span></button><a href="/search" aria-current={path === '/search' ? 'page' : undefined}><HypeIcon kind="search" />{text('البحث', 'Search')}</a></nav> : null}
    <UiBlock slot="after_footer" /><HypeCart open={cart} close={() => setCart(false)} /><Drawer open={menu} onClose={() => setMenu(false)} title={text('القائمة', 'Menu')} side="start" className="hyp-menu hpf-menu"><nav className="sf-overlay__body" aria-label={text('القائمة الرئيسية', 'Main navigation')}>{nav.map(item => <div key={`${item.url}-${item.label}`}><a href={item.url} onClick={() => setMenu(false)}>{item.label}</a>{item.children?.map(child => <a className="hyp-menu-child" key={child.url} href={child.url} onClick={() => setMenu(false)}>{child.label}</a>)}</div>)}{store.supportedLocales.includes('ar') && store.supportedLocales.includes('en') ? <button className="hpf-menu-language" type="button" onClick={() => { setLocale(ar ? 'en' : 'ar'); setMenu(false); }}>{ar ? 'English' : 'العربية'}</button> : null}<CurrencySwitcher variant="drawer" className="hpf-menu-currency" /></nav></Drawer>
  </div>;
}
export function FashionLayout(props: LayoutRenderProps): ReactElement { return <ToastProvider><CartProvider><Bridge {...props} /></CartProvider></ToastProvider>; }
