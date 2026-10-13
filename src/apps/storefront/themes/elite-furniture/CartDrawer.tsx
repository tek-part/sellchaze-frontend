import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../foundation/components/Drawer';
import { useCart } from '../../state/cart';
import { useStore } from '../../state/store-context';
import { useLocale } from '../../i18n/useLocale';
import { cartLineLimit, quantityStep } from '../../state/cart-quantity';
import { cartHasFreeShippingOffer, cartRequiresShipping, shippingThreshold } from '../../utils/shipping';
import { PersonalizationSummary } from '../../foundation/components/PersonalizationSummary';
import { formatMoney } from '../../utils/format';
import { EliteIcon } from './icons';

export function EliteCart({ open, close }: { open: boolean; close: () => void }): ReactElement {
  const { lines, totals, updateQuantity, remove } = useCart(); const { t } = useTranslation(); const { locale } = useLocale(); const { store } = useStore();
  const threshold = shippingThreshold(store.shipping, totals.currency, store.currencyMultipliers); const free = cartHasFreeShippingOffer(lines); const remaining = free ? 0 : Math.max(0, (threshold ?? 0) - totals.subtotal);
  return <Drawer open={open} onClose={close} title={t('cart.title')} className="elt-cart"><div className="sf-overlay__body">{!lines.length ? <div className="elt-cart-empty"><EliteIcon kind="bag" /><p>{t('cart.empty')}</p><a href="/shop" onClick={close}>{t('nav.allProducts')}</a></div> : <>{cartRequiresShipping(lines) && (free || threshold !== undefined) ? <div className="elt-cart-shipping"><p>{free ? locale === 'ar' ? 'شحن مجاني مع العرض المختار، يُؤكد عند الدفع.' : 'Free shipping with the selected offer, confirmed at checkout.' : remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</p><progress max="100" value={free || threshold === 0 ? 100 : threshold ? Math.min(100, totals.subtotal / threshold * 100) : 0} /></div> : null}<ul>{lines.map(line => <li key={line.id}>{line.image ? <img src={line.image} alt="" /> : null}<div><a href={line.url}>{line.title}</a>{line.attributes ? <small>{line.attributes}</small> : null}<PersonalizationSummary entries={line.personalizationEntries} /><strong>{formatMoney(line.price * line.quantity, line.currency, locale)}</strong><div className="elt-cart-quantity"><button type="button" disabled={line.quantity <= quantityStep(line)} aria-label={t('product.decreaseQuantity')} onClick={() => updateQuantity(line.id, line.quantity - quantityStep(line))}><EliteIcon kind="minus" /></button><output aria-live="polite">{line.quantity}</output><button type="button" disabled={line.quantity >= cartLineLimit(lines, line)} aria-label={t('product.increaseQuantity')} onClick={() => updateQuantity(line.id, line.quantity + quantityStep(line))}><EliteIcon kind="plus" /></button><button type="button" aria-label={`${t('common.remove')}: ${line.title}`} onClick={() => remove(line.id)}><EliteIcon kind="trash" /></button></div></div></li>)}</ul></>}</div>{lines.length ? <div className="sf-overlay__footer"><div className="elt-cart-total"><span>{t('cart.subtotal')}</span><strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong></div><a className="elt-cart-checkout" href="/checkout" onClick={close}>{t('cart.checkout')}</a><a href="/cart" onClick={close}>{t('cart.viewBag')}</a></div> : null}</Drawer>;
}
