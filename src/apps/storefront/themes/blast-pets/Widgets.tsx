import type { ReactElement } from 'react';
import type { StorefrontContext } from '../../theme-engine/rendering';
import { useCart } from '../../state/cart';
import { useStore } from '../../state/store-context';
import { useLocale } from '../../i18n/useLocale';
import { cartHasFreeShippingOffer, cartRequiresShipping, shippingThreshold } from '../../utils/shipping';
import { formatMoney } from '../../utils/format';
import { LibCarousel } from '../../sections-lib/primitives';
import { PetCard } from './PetCard';
import { petProducts } from './data';

export function PetsShipping({ context }: { context: StorefrontContext }): ReactElement | null {
  const { store } = useStore(); const { locale } = useLocale(); const { lines, totals } = useCart(); const ar = locale === 'ar';
  const threshold = shippingThreshold(store.shipping, totals.currency, store.currencyMultipliers); const free = cartHasFreeShippingOffer(lines); const physical = lines.length === 0 || cartRequiresShipping(lines);
  if (!physical || (!free && threshold === undefined)) return null;
  const remaining = Math.max(0, (threshold ?? 0) - totals.subtotal); const products = petProducts(context, 'featured', 8).filter(product => !lines.some(line => line.productId === product.id));
  return <aside className="bpt-shipping"><p>{free || remaining === 0 ? ar ? 'شحن مجاني، يُؤكَّد عند الدفع.' : 'Free shipping, confirmed at checkout.' : ar ? `باقي ${formatMoney(remaining, totals.currency, locale)} للحصول على شحن مجاني!` : `You're only ${formatMoney(remaining, totals.currency, locale)} away from free shipping!`}</p><progress max="100" value={free || threshold === 0 ? 100 : threshold ? Math.min(100, totals.subtotal / threshold * 100) : 0} aria-label={ar ? 'التقدم نحو الشحن المجاني' : 'Free shipping progress'} />{products.length ? <LibCarousel ariaLabel={ar ? 'منتجات مقترحة' : 'Suggested products'} showArrows className="bpt-cross-sell">{products.map(product => <PetCard key={product.id} product={product} compact />)}</LibCarousel> : null}</aside>;
}
