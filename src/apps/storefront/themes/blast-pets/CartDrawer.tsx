import type { ReactElement } from 'react';
import type { StorefrontContext } from '../../theme-engine/rendering';
import { Drawer } from '../../foundation/components/Drawer';
import { PersonalizationSummary } from '../../foundation/components/PersonalizationSummary';
import { useCart } from '../../state/cart';
import { useLocale } from '../../i18n/useLocale';
import { cartLineLimit, quantityStep } from '../../state/cart-quantity';
import { formatMoney } from '../../utils/format';
import { PetsShipping } from './Widgets';

export function PetsCart({ open, close, context }: { open: boolean; close: () => void; context: StorefrontContext }): ReactElement {
  const { lines, totals, updateQuantity, remove } = useCart(); const { locale } = useLocale(); const ar = locale === 'ar';
  return <Drawer open={open} onClose={close} side="start" title={ar ? 'السلة' : 'Cart'} className="bpt-cart"><div className="sf-overlay__body"><PetsShipping context={context} />{!lines.length ? <div className="bpt-cart-empty"><h2>{ar ? 'السلة فارغة' : 'Empty Cart'}</h2><p>{ar ? 'لا توجد منتجات في سلتك' : 'You have no items in your cart'}</p></div> : <ul>{lines.map(line => <li key={line.id}>{line.image ? <img src={line.image} alt="" /> : null}<div><a href={line.url}>{line.title}</a>{line.attributes ? <small>{line.attributes}</small> : null}<PersonalizationSummary entries={line.personalizationEntries} /><strong>{formatMoney(line.price * line.quantity, line.currency, locale)}</strong><div className="bpt-cart-quantity"><button type="button" disabled={line.quantity <= quantityStep(line)} aria-label={`${ar ? 'تقليل الكمية' : 'Decrease quantity'}: ${line.title}`} onClick={() => updateQuantity(line.id, line.quantity - quantityStep(line))}>−</button><output>{line.quantity}</output><button type="button" disabled={line.quantity >= cartLineLimit(lines, line)} aria-label={`${ar ? 'زيادة الكمية' : 'Increase quantity'}: ${line.title}`} onClick={() => updateQuantity(line.id, line.quantity + quantityStep(line))}>+</button><button type="button" aria-label={`${ar ? 'إزالة' : 'Remove'}: ${line.title}`} onClick={() => remove(line.id)}>×</button></div></div></li>)}</ul>}</div>{lines.length ? <div className="sf-overlay__footer"><div className="bpt-cart-total"><span>{ar ? 'المجموع' : 'Subtotal'}</span><strong>{formatMoney(totals.subtotal, totals.currency, locale)}</strong></div><a className="bpt-button" href="/checkout" onClick={close}>{ar ? 'إتمام الطلب' : 'Checkout'}</a><a href="/cart" onClick={close}>{ar ? 'عرض السلة' : 'View cart'}</a></div> : null}</Drawer>;
}
