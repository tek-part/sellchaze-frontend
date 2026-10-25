/**
 * CartPage — /cart. The full bag: line items with quantity/remove + an order summary with checkout.
 * Reads/writes the shared cart store; empty state when there's nothing in the bag.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ButtonLink,
  Container,
  EmptyState,
  Section,
} from '../foundation/components';
import { useCart } from '../state/cart';
import { cartLineLimit, quantityStep } from '../state/cart-quantity';
import { PersonalizationSummary } from '../foundation/components/PersonalizationSummary';
import { useStore } from '../state/store-context';
import { formatMoney } from '../utils/format';
import { useLocale } from '../i18n/useLocale';
import { ThemeRenderer, useTemplate } from '../theme-engine';
import { flowContext } from './flow-context';
import './checkout/checkout.css';
import { cartRequiresShipping } from '../utils/shipping';

export function CartPage(): ReactElement {
  const { t } = useTranslation();
  const cart = useCart();
  const { store } = useStore();
  const { locale } = useLocale();
  const ar = locale === 'ar';
  const tpl = useTemplate('cart');

  if (tpl) return <ThemeRenderer page={tpl} context={flowContext(store)} />;

  if (cart.lines.length === 0) {
    return (
      <Section>
        <Container>
          <EmptyState
            variant="cart"
            title={t('cart.empty')}
            description={t('cart.emptyBrowseHint')}
            actions={<ButtonLink href="/collections/new-in">{t('cart.shopNewIn')}</ButtonLink>}
          />
        </Container>
      </Section>
    );
  }

  const currency = cart.totals.currency || store.currency;
  const money = (value: number): string => formatMoney(value, currency, locale);
  const count = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const marks = (store.paymentMarks ?? []).filter((mark) => mark.logo_url);

  return (
    <Section>
      <Container>
        <div className="sf-cart2__head">
          <h1>{t('cart.title')} <span className="sf-cart2-line__meta" style={{ display: 'inline' }}>({count})</span></h1>
          <a href="/collections/all">{t('cart.continueShopping')}</a>
        </div>
        <div className="sf-cart2">
          <div>
            <div className="sf-cart2__cols" aria-hidden><span>{ar ? 'المنتج' : 'Product'}</span><span>{ar ? 'الكمية' : 'Quantity'}</span><span>{ar ? 'الإجمالي' : 'Total'}</span></div>
            <ul className="sf-cart2__lines">
              {cart.lines.map((line) => {
                const step = quantityStep(line);
                const max = cartLineLimit(cart.lines, line);
                return <li key={line.id} className="sf-cart2-line">
                  <div className="sf-cart2-line__product">
                    <a className="sf-cart2-line__img" href={line.url} tabIndex={-1} aria-hidden>{line.image ? <img src={line.image} alt="" loading="lazy" /> : null}</a>
                    <div>
                      <a className="sf-cart2-line__title" href={line.url}>{line.title}</a>
                      {line.attributes ? <span className="sf-cart2-line__meta">{line.attributes}</span> : null}
                      <span className="sf-cart2-line__unit">{money(line.price)}</span>
                      <PersonalizationSummary entries={line.personalizationEntries} />
                    </div>
                  </div>
                  <div className="sf-cart2-line__qty">
                    <div className="sf-cart2-qty" role="group" aria-label={ar ? `كمية ${line.title}` : `Quantity for ${line.title}`}>
                      <button type="button" aria-label={ar ? 'إنقاص الكمية' : 'Decrease quantity'} disabled={line.quantity - step < step} onClick={() => cart.updateQuantity(line.id, line.quantity - step)}>−</button>
                      <output aria-live="polite">{line.quantity}</output>
                      <button type="button" aria-label={ar ? 'زيادة الكمية' : 'Increase quantity'} disabled={line.quantity + step > max} onClick={() => cart.updateQuantity(line.id, line.quantity + step)}>+</button>
                    </div>
                    <button type="button" className="sf-cart2-remove" aria-label={ar ? `حذف ${line.title}` : `Remove ${line.title}`} onClick={() => cart.remove(line.id)}>
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" /></svg>
                    </button>
                  </div>
                  <span className="sf-cart2-line__total">{money(line.price * line.quantity)}</span>
                </li>;
              })}
            </ul>
          </div>
          <aside className="sf-cart2-summary" aria-label={ar ? 'ملخص السلة' : 'Cart summary'}>
            <h2>{ar ? 'ملخص الطلب' : 'Order summary'}</h2>
            <div className="sf-co-row"><span>{t('cart.subtotal')}</span><span>{money(cart.totals.subtotal)}</span></div>
            {cartRequiresShipping(cart.lines) ? <div className="sf-co-row sf-co-row--muted"><span>{t('checkout.shipping')}</span><span>{t('checkout.calculatedAtCheckout')}</span></div> : null}
            <div className="sf-co-total"><span>{t('checkout.total')}</span><span className="sf-co-total__value"><span className="sf-co-total__currency">{currency}</span>{money(cart.totals.subtotal)}</span></div>
            <ButtonLink href="/checkout" block>{t('cart.checkout')}</ButtonLink>
            <p className="sf-co-trust" style={{ margin: 0 }}><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden focusable="false"><path fill="currentColor" d="M10 2a4 4 0 0 0-4 4v2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1V6a4 4 0 0 0-4-4Zm-2 6V6a2 2 0 1 1 4 0v2H8Z" /></svg>{ar ? 'دفع آمن ومشفّر' : 'Secure, encrypted checkout'}</p>
            {marks.length ? <div className="sf-cart2-marks">{marks.map((mark) => <img key={mark.name} src={mark.logo_url ?? ''} alt={mark.name} title={mark.name} loading="lazy" />)}</div> : null}
          </aside>
        </div>
      </Container>
    </Section>
  );
}
