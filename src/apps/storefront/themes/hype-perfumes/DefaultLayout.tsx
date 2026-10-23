import { densityImage } from '../../foundation/media/responsive';
import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import type { LayoutRenderProps } from '../../theme-engine/rendering';
import type { NavItem, FooterGroup } from '../../types/navigation';
import { useReducedMotion, useThemeSettings, useThemeTokens } from '../../theme-engine/context';
import { CartProvider, useCart } from '../../state/cart';
import { useWishlist } from '../../state/wishlist';
import { useStore } from '../../state/store-context';
import { useLocale } from '../../i18n/useLocale';
import { ToastProvider } from '../../foundation/components/toast/ToastProvider';
import { Drawer } from '../../foundation/components/Drawer';
import { ProductHeaderChrome } from '../../state/product-presentation';
import { StorePaymentMarks } from '../../shared-ui/PaymentMarks';
import { UiBlock } from '../../ui-blocks/UiBlocks';
import { PureNewsletter } from '../pure-furniture/DefaultLayout';
import { HypeCart } from './CartDrawer';
import { HypeIcon } from './icons';

interface NavigationData { categoryNavigation?: ReadonlyArray<NavItem>; allCategoryNavigation?: ReadonlyArray<NavItem>; headerPageNavigation?: ReadonlyArray<NavItem>; managedHeaderNavigation?: ReadonlyArray<NavItem> | null; sphinxFooterNavigation?: ReadonlyArray<FooterGroup>; social?: ReadonlyArray<{ label: string; url: string }>; year?: number }
function RoutedChrome(props: LayoutRenderProps): ReactElement { return <Chrome {...props} checkout={useLocation().pathname === '/checkout'} />; }
function Bridge(props: LayoutRenderProps): ReactElement { return useInRouterContext() ? <RoutedChrome {...props} /> : <Chrome {...props} />; }
function Chrome({ context, children, checkout = false }: LayoutRenderProps & { checkout?: boolean }): ReactElement {
  const settings = useThemeSettings(); const tokens = useThemeTokens(); const { store } = useStore(); const { locale, setLocale } = useLocale(); const { totals } = useCart(); const wishlist = useWishlist(); const ar = locale === 'ar'; const text = (a: string, e: string): string => ar ? a : e; const data = context.data as NavigationData;
  const nav = data.managedHeaderNavigation ?? [...data.categoryNavigation ?? [], ...data.headerPageNavigation ?? []]; const categories = data.allCategoryNavigation ?? data.categoryNavigation ?? []; const footer = data.sphinxFooterNavigation ?? [];
  const [menu, setMenu] = useState(false); const [cart, setCart] = useState(false);
  const root = useRef<HTMLDivElement>(null); const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === 'undefined') return;
    const sections = root.current?.querySelectorAll('.hyp-section,.hyp-story,.hyp-testimonials,.hyp-newsletter') ?? [];
    const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('hyp-revealed'); observer.unobserve(entry.target); } }, { threshold: 0.08 });
    for (const section of sections) { section.classList.add('hyp-reveal'); observer.observe(section); }
    return () => { observer.disconnect(); for (const section of sections) section.classList.remove('hyp-reveal', 'hyp-revealed'); };
  }, [reducedMotion]);
  useEffect(() => { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Newsreader:wght@300;400;500;600&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap'; document.head.appendChild(link); return () => link.remove(); }, []);
  const brand = <a href="/" className="hyp-brand" aria-label={store.name}>{store.logoUrl ? <img {...densityImage(store.logoUrl, 240)} decoding="async" alt={store.name} /> : <span>{store.name}</span>}</a>;
  return <div ref={root} data-reduced-motion={reducedMotion} className={`hyp-root${checkout ? ' hyp-checkout' : ''}`} style={{ '--font': tokens.typography.fontSans, '--font-arabic': tokens.typography.fontArabic } as CSSProperties}>
    <ProductHeaderChrome><UiBlock slot="before_header" /><header className="hyp-header"><button className="hyp-menu-trigger" type="button" aria-label={text('افتح القائمة', 'Open menu')} onClick={() => setMenu(true)}><HypeIcon kind="menu" /></button>{brand}<nav className="hyp-nav" aria-label={text('القائمة الرئيسية', 'Main navigation')}>{nav.slice(0, 6).map(item => <div className="hyp-nav-item" key={`${item.url}-${item.label}`}><a href={item.url}>{item.label}</a>{item.children?.length ? <div className="hyp-nav-submenu">{item.children.map(child => <a key={child.url} href={child.url}>{child.label}</a>)}</div> : null}</div>)}{nav.length > 6 ? <details><summary>{text('المزيد', 'More')}</summary><div className="hyp-nav-overflow">{nav.slice(6).map(item => <a key={item.url} href={item.url}>{item.label}</a>)}</div></details> : null}</nav><div className="hyp-header-actions"><a href="/search" aria-label={text('البحث', 'Search')}><HypeIcon kind="search" /></a><a className="hyp-wishlist-link" href="/wishlist" aria-label={`${text('المفضلة', 'Wishlist')} (${wishlist.count})`}><HypeIcon kind="heart" />{wishlist.count ? <span>{wishlist.count}</span> : null}</a>{store.supportedLocales.includes('ar') && store.supportedLocales.includes('en') ? <button className="hyp-language" type="button" aria-label={text('تغيير اللغة', 'Change language')} onClick={() => setLocale(ar ? 'en' : 'ar')}>{ar ? 'EN' : 'ع'}</button> : null}<button type="button" aria-label={`${text('السلة', 'Cart')} (${totals.count})`} onClick={() => setCart(true)}><HypeIcon kind="bag" /><span>{totals.count}</span></button></div></header><UiBlock slot="after_header" /></ProductHeaderChrome>
    <main id="sf-main">{children}</main><UiBlock slot="before_footer" />
    {!checkout ? <footer className="hyp-footer"><div className="hyp-footer-grid"><div className="hyp-footer-contact">{brand}{settings['address'] || store.merchantInformation?.address ? <p>{String(settings['address'] || store.merchantInformation?.address)}</p> : null}{store.email ? <a href={`mailto:${store.email}`}>{store.email}</a> : null}{store.phone ? <a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{store.phone}</a> : null}{data.social?.length ? <><h4>{text('تابعنا', 'Follow us')}</h4><nav aria-label={text('روابط التواصل الاجتماعي', 'Social links')}>{data.social.map(item => <a href={item.url} key={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>)}</nav></> : null}</div>{categories.length ? <nav aria-label={text('المتجر', 'Shop')}><h4>{text('المتجر', 'Shop')}</h4>{categories.map(item => <a href={item.url} key={item.url}>{item.label}</a>)}</nav> : null}{footer.map(group => <nav key={group.title} aria-label={group.title}><h4>{group.title}</h4>{group.links.map(item => <a key={item.url} href={item.url}>{item.label}</a>)}</nav>)}{settings['show_newsletter'] !== false ? <div className="hyp-footer-newsletter"><PureNewsletter compact /></div> : null}</div><div className="hyp-footer-bottom"><StorePaymentMarks label={text('وسائل الدفع المقبولة', 'Accepted payment methods')} /><p>© {data.year ?? new Date().getFullYear()} {store.name} · <a href="https://sellchaze.com/">Sellchaze</a></p></div></footer> : <footer className="hyp-checkout-footer">{footer.flatMap(group => group.links).map(item => <a href={item.url} key={item.url}>{item.label}</a>)}</footer>}
    <UiBlock slot="after_footer" /><HypeCart open={cart} close={() => setCart(false)} /><Drawer open={menu} onClose={() => setMenu(false)} title={text('القائمة', 'Menu')} side="start" className="hyp-menu"><nav className="sf-overlay__body" aria-label={text('القائمة الرئيسية', 'Main navigation')}>{nav.map(item => <div key={`${item.url}-${item.label}`}><a href={item.url} onClick={() => setMenu(false)}>{item.label}</a>{item.children?.map(child => <a className="hyp-menu-child" href={child.url} key={child.url} onClick={() => setMenu(false)}>{child.label}</a>)}</div>)}</nav></Drawer>
  </div>;
}
export function HypeLayout(props: LayoutRenderProps): ReactElement { return <ToastProvider><CartProvider><Bridge {...props} /></CartProvider></ToastProvider>; }
