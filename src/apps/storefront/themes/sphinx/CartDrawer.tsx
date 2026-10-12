import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer } from '../../foundation/components/Drawer';
import { useCart } from '../../state/cart';
import { cartLineLimit, quantityStep } from '../../state/cart-quantity';
import { PersonalizationSummary } from '../../foundation/components/PersonalizationSummary';
import { formatMoney } from '../../utils/format';
import { useLocale } from '../../i18n/useLocale';
import { MinusIcon, PlusIcon, TrashIcon } from './icons';
import { useStore } from '../../state/store-context';
import { cartHasFreeShippingOffer, cartRequiresShipping, shippingThreshold } from '../../utils/shipping';

export function SphinxCart({ open, close }: { open: boolean; close: () => void }): ReactElement {
  const { lines, totals, updateQuantity, remove } = useCart(); const { t } = useTranslation(); const { locale } = useLocale();
  const { store } = useStore();
  const threshold = shippingThreshold(store.shipping, totals.currency, store.currencyMultipliers);
  const free = cartHasFreeShippingOffer(lines);
  const remaining = free ? 0 : Math.max(0, (threshold ?? 0) - totals.subtotal);
  const progress = free || threshold === 0 ? 100 : threshold ? Math.min(100, totals.subtotal / threshold * 100) : 0;
  return <Drawer open={open} onClose={close} title={t('cart.title')} className="sph-cart"><div className="sf-overlay__body">{!lines.length ? <div className="sph-cart__empty"><p>{t('cart.empty')}</p><a href="/shop" onClick={close}>{t('nav.allProducts')}</a></div> : <>{cartRequiresShipping(lines) && (free || threshold !== undefined) ? <div className="sph-cart__shipping"><p>{free ? (locale === 'ar' ? 'شحن مجاني مع عرض الكمية المختار؛ يُؤكد عند الدفع' : 'Free shipping with the selected quantity offer; confirmed at checkout') : remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</p><div aria-hidden="true"><span style={{ width: `${progress}%` }} /></div></div> : null}<ul>{lines.map((line) => <li key={line.id}>{line.image ? <img src={line.image} alt="" /> : null}<div><a href={line.url}>{line.title}</a>{line.attributes ? <small>{line.attributes}</small> : null}<PersonalizationSummary entries={line.personalizationEntries} /><strong>{formatMoney(line.price * line.quantity, line.currency, locale)}</strong><div className="sph-cart__quantity"><button onClick={() => updateQuantity(line.id, line.quantity - quantityStep(line))} disabled={line.quantity <= quantityStep(line)} aria-label={t('product.decreaseQuantity')}><MinusIcon /></button><output aria-live="polite">{line.quantity}</output><button onClick={() => updateQuantity(line.id, line.quantity + quantityStep(line))} disabled={line.quantity >= cartLineLimit(lines, line)} aria-label={t('product.increaseQuantity')}><PlusIcon /></button><button onClick={() => remove(line.id)} aria-label={`${t('common.remove')}: ${line.title}`}><TrashIcon /></button></div></div></li>)}</ul></>}</div>{lines.length ? <div className="sf-overlay__footer"><div className="sph-cart__total"><span>{t('cart.subtotal')}</span><strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong></div><a className="sph-cart__checkout" href="/checkout" onClick={close}>{t('cart.checkout')}</a><a className="sph-cart__view" href="/cart" onClick={close}>{t('cart.viewBag')}</a></div> : null}</Drawer>;
}

