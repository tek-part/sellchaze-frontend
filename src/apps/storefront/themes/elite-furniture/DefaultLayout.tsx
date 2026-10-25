import { densityImage } from '../../foundation/media/responsive';
import { StorePaymentMarks } from '../../shared-ui/PaymentMarks';
import { ProductHeaderChrome } from '../../state/product-presentation';
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent, type ReactElement } from 'react';
import { useInRouterContext, useLocation } from 'react-router-dom';
import type { LayoutRenderProps } from '../../theme-engine/rendering';
import type { NavItem, FooterGroup } from '../../types/navigation';
import { useThemeSettings, useThemeTokens } from '../../theme-engine/context';
import { CartProvider, useCart } from '../../state/cart';
import { useStore } from '../../state/store-context';
import { useLocale } from '../../i18n/useLocale';
import { ToastProvider } from '../../foundation/components/toast/ToastProvider';
import { Drawer } from '../../foundation/components/Drawer';
import { CurrencySwitcher } from '../../foundation/components/CurrencySwitcher';
import { UiBlock } from '../../ui-blocks/UiBlocks';
import { subscribeNewsletter } from '../../api/storefront';
import { EliteCart } from './CartDrawer';
import { EliteIcon } from './icons';

interface NavigationData { categoryNavigation?: ReadonlyArray<NavItem>; allCategoryNavigation?: ReadonlyArray<NavItem>; headerPageNavigation?: ReadonlyArray<NavItem>; managedHeaderNavigation?: ReadonlyArray<NavItem> | null; sphinxFooterNavigation?: ReadonlyArray<FooterGroup>; year?: number }

export function EliteNewsletter({ compact = false }: { compact?: boolean }): ReactElement {
  const { locale } = useLocale(); const ar = locale === 'ar'; const id = useId(); const [email, setEmail] = useState(''); const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault(); if (busy) return; setBusy(true); setStatus('');
    try { await subscribeNewsletter(email.trim()); setStatus(ar ? 'تم الاشتراك بنجاح.' : 'You are subscribed.'); setEmail(''); }
    catch { setStatus(ar ? 'تعذر الاشتراك. حاول مجددًا.' : 'Unable to subscribe. Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className={`elt-newsletter${compact ? ' is-compact' : ''}`}>{!compact ? <><p className="elt-eyebrow">{ar ? 'كن أول من يعرف' : 'Keep me updated'}</p><h2>{ar ? 'النشرة الإخبارية' : 'Newsletter'}</h2><p>{ar ? 'اشترك لتصلك أخبار المجموعات الجديدة والعروض.' : 'Stay informed about new collections and store offers.'}</p></> : <h4>{ar ? 'اشترك في النشرة الإخبارية' : 'Subscribe to our newsletter'}</h4>}<form onSubmit={event => void submit(event)}><label className="lib-sr-only" htmlFor={id}>{ar ? 'البريد الإلكتروني' : 'Email'}</label><input id={id} type="email" name="email" autoComplete="email" required maxLength={255} placeholder={ar ? 'البريد الإلكتروني' : 'E-mail'} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /><button type="submit" disabled={busy}>{busy ? '…' : compact ? <EliteIcon kind="arrow" /> : ar ? 'اشترك' : 'Subscribe'}{compact ? <span className="lib-sr-only">{ar ? 'اشترك' : 'Subscribe'}</span> : null}</button></form>{status ? <p role="status">{status}</p> : !compact ? <small>{ar ? 'بالاشتراك توافق على تلقي رسائل المتجر. يمكنك إلغاء الاشتراك في أي وقت.' : 'Subscribe to receive store emails. You can unsubscribe at any time.'}</small> : null}</div>;
}

function RoutedChrome(props: LayoutRenderProps): ReactElement { const { pathname } = useLocation(); return <Chrome {...props} checkout={pathname === '/checkout'} />; }
function Bridge(props: LayoutRenderProps): ReactElement { return useInRouterContext() ? <RoutedChrome {...props} /> : <Chrome {...props} />; }
function Chrome({ context, children, checkout = false }: LayoutRenderProps & { checkout?: boolean }): ReactElement {
  const settings = useThemeSettings(); const tokens = useThemeTokens(); const { store } = useStore(); const { locale, setLocale } = useLocale(); const { totals } = useCart();
  const ar = locale === 'ar'; const text = (a: string, e: string): string => ar ? a : e; const data = context.data as NavigationData;
  const nav = data.managedHeaderNavigation ?? [...data.categoryNavigation ?? [], ...data.headerPageNavigation ?? []]; const footer = data.sphinxFooterNavigation ?? [];
  const [menuOpen, setMenuOpen] = useState(false); const [cartOpen, setCartOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: 0.05 });
    root.current.querySelectorAll('.elt-category,.elt-card,.elt-compare__photos,.lib-split').forEach(element => { element.classList.add('elt-motion'); observer.observe(element); });
    return () => observer.disconnect();
  }, [children]);
  useEffect(() => {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap'; document.head.appendChild(link); return () => link.remove();
  }, []);
  const brand = <a href="/" className="elt-brand" aria-label={store.name}>{store.logoUrl ? <img {...densityImage(store.logoUrl, 240)} decoding="async" alt={store.name} /> : <span>{store.name}</span>}</a>;
  const categoryLinks = data.allCategoryNavigation ?? data.categoryNavigation ?? [];
  return <div ref={root} className={`elt-root${checkout ? ' elt-checkout' : ''}`} style={{ '--font': tokens.typography.fontSans, '--font-arabic': tokens.typography.fontArabic, '--heading': tokens.typography.fontSerif } as CSSProperties}>
    <ProductHeaderChrome><UiBlock slot="before_header" /><header className="elt-header"><button className="elt-menu-trigger" type="button" onClick={() => setMenuOpen(true)} aria-label={text('افتح القائمة', 'Open menu')}><EliteIcon kind="menu" /></button><nav className="elt-header-nav" aria-label={text('القائمة الرئيسية', 'Main navigation')}>{nav.slice(0, 5).map(item => <a key={`${item.url}-${item.label}`} href={item.url}>{item.label}</a>)}{nav.length > 5 ? <details><summary>{text('المزيد', 'More')} <EliteIcon kind="down" /></summary><div>{nav.slice(5).map(item => <a key={`${item.url}-${item.label}`} href={item.url}>{item.label}</a>)}</div></details> : null}</nav>{brand}<div className="elt-header-actions"><a href="/search" aria-label={text('البحث', 'Search')}><EliteIcon kind="search" /></a>{store.supportedLocales.includes('ar') && store.supportedLocales.includes('en') ? <button type="button" onClick={() => setLocale(ar ? 'en' : 'ar')} aria-label={text('تغيير اللغة', 'Change language')}>{ar ? 'EN' : 'ع'}</button> : null}<CurrencySwitcher className="elt-currency" /><button type="button" onClick={() => setCartOpen(true)} aria-label={`${text('السلة', 'Cart')} (${totals.count})`}><EliteIcon kind="bag" />{totals.count ? <span className="elt-bag-count">{totals.count}</span> : null}</button></div></header><UiBlock slot="after_header" /></ProductHeaderChrome>
    <main id="sf-main">{children}</main><UiBlock slot="before_footer" />
    {!checkout ? <footer className="elt-footer"><div className="elt-footer-brand">{brand}{store.description ? <p>{store.description}</p> : null}</div><div className="elt-footer-grid">{categoryLinks.length ? <div><h4>{text('المتجر', 'Shop')}</h4><ul>{categoryLinks.map(item => <li key={item.url}><a href={item.url}>{item.label}</a></li>)}</ul></div> : null}{footer.map(group => <div key={group.title}><h4>{group.title}</h4><ul>{group.links.map(link => <li key={link.url}><a href={link.url}>{link.label}</a></li>)}</ul></div>)}<div><h4>{text('تواصل معنا', 'Contact us')}</h4>{store.phone ? <p><small>{text('الهاتف', 'Phone')}</small><a href={`tel:${store.phone.replace(/[^+\d]/g, '')}`} dir="ltr">{store.phone}</a></p> : null}{store.email ? <p><small>{text('البريد الإلكتروني', 'Email')}</small><a href={`mailto:${store.email}`}>{store.email}</a></p> : null}{settings['address'] ? <p><small>{text('العنوان', 'Address')}</small>{String(settings['address'])}</p> : null}</div>{settings['show_newsletter'] !== false ? <EliteNewsletter compact /> : null}</div><div className="elt-footer-legal"><p>© {data.year ?? 2026} {store.name}</p><p>Sellchaze</p></div><StorePaymentMarks label={text('وسائل الدفع المقبولة', 'Accepted payment methods')} /></footer> : <footer className="elt-checkout-footer">{footer.flatMap(group => group.links).map(link => <a href={link.url} key={link.url}>{link.label}</a>)}</footer>}
    <UiBlock slot="after_footer" /><EliteCart open={cartOpen} close={() => setCartOpen(false)} /><Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={text('القائمة', 'Menu')} side="start" className="elt-menu"><nav className="sf-overlay__body" aria-label={text('القائمة الرئيسية', 'Main navigation')}>{nav.map(item => <div key={`${item.url}-${item.label}`}><a href={item.url} onClick={() => setMenuOpen(false)}>{item.label}</a>{item.children?.map(child => <a className="elt-menu-child" key={child.url} href={child.url} onClick={() => setMenuOpen(false)}>{child.label}</a>)}</div>)}<CurrencySwitcher variant="drawer" className="elt-menu-currency" /></nav></Drawer>
  </div>;
}
export function EliteLayout(props: LayoutRenderProps): ReactElement { return <ToastProvider><CartProvider><Bridge {...props} /></CartProvider></ToastProvider>; }
