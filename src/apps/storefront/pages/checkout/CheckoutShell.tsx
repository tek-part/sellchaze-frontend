/**
 * Distraction-free checkout frame (Shopify-style): the store's logo, a "secure checkout" mark and a
 * way back to the cart — no theme navigation, announcement bar or footer menus that could pull a
 * buyer out of the purchase. Colours, fonts and radii still come from the active theme's tokens, so
 * every theme gets a checkout that looks like itself.
 */
import type { ReactElement, ReactNode } from 'react';
import { useLocale } from '../../i18n/useLocale';
import { useStore } from '../../state/store-context';
import { useCart } from '../../state/cart';
import { densityImage } from '../../foundation/media/responsive';
import './checkout.css';

function LockIcon(): ReactElement {
  return <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden focusable="false"><path fill="currentColor" d="M10 2a4 4 0 0 0-4 4v2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4Zm-2 6V6a2 2 0 1 1 4 0v2H8Z" /></svg>;
}

function BagIcon(): ReactElement {
  return <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden focusable="false"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" d="M5 8h14l-1.2 12H6.2L5 8Zm3 0V6a4 4 0 0 1 8 0v2" /></svg>;
}

export function CheckoutShell({ children, cartLink = true }: { children: ReactNode; cartLink?: boolean }): ReactElement {
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const { store } = useStore();
  const cart = useCart();
  const count = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const logo = store.logoUrl && store.logoUrl !== '/brand-logo.svg' ? store.logoUrl : '';
  const policies = store.merchantInformation?.policies ?? [];

  return <div className="sf-co-shell">
    <header className="sf-co-header">
      <div className="sf-co-header__inner">
        <a className="sf-co-brand" href="/">{logo ? <img {...densityImage(logo, 240)} alt={store.name} decoding="async" /> : <span>{store.name}</span>}</a>
        <span className="sf-co-secure"><LockIcon />{ar ? 'دفع آمن' : 'Secure checkout'}</span>
        {cartLink ? <a className="sf-co-bag" href="/cart" aria-label={ar ? `العودة إلى السلة (${count})` : `Back to cart (${count})`}><BagIcon />{count ? <span className="sf-co-bag__count">{count}</span> : null}</a> : null}
      </div>
    </header>
    <main id="sf-main" className="sf-co-main">{children}</main>
    <footer className="sf-co-footer">
      <nav aria-label={ar ? 'سياسات المتجر' : 'Store policies'}>
        {policies.map((policy) => <a key={policy.kind} href={policy.url || `/policies/${policy.kind}`}>{policy.title}</a>)}
      </nav>
      <p>© {new Date().getFullYear()} {store.name}</p>
    </footer>
  </div>;
}
