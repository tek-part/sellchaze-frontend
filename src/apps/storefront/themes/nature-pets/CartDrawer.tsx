import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { KidsCart } from '../nature-kids/CartDrawer';
import { useCart } from '../../state/cart';
import { useStore } from '../../state/store-context';
import { useLocale } from '../../i18n/useLocale';
import { useAsync } from '../../api/useAsync';
import { getProducts } from '../../api/storefront';
import { toProductCard } from '../../api/mappers';
import { sampleNewest } from '../../dev/sampleData';
import { previewOrDev } from '../../preview';
import { cartHasFreeShippingOffer, cartRequiresShipping, shippingThreshold } from '../../utils/shipping';
import { formatMoney } from '../../utils/format';
import type { ProductCardModel } from '../../types/catalog';
import { CardVariantPicker, useCardPurchase } from '../../foundation/components/CardVariantPicker';
import { QuickView } from '../../foundation/components/QuickView';
import { KidsIcon } from '../nature-kids/icons';
function RecommendedProduct({ product }: { product: ProductCardModel }): ReactElement {
 const { locale } = useLocale(); const ar = locale === 'ar'; const purchase = useCardPurchase(product); const [quick, setQuick] = useState(false); const [added, setAdded] = useState(false);
 const price = <div className="npt-recommendation-price"><strong>{formatMoney(purchase.price, product.currency, locale)}</strong>{purchase.compareAt && purchase.compareAt > purchase.price ? <del>{formatMoney(purchase.compareAt, product.currency, locale)}</del> : null}</div>;
 const add = <button type="button" className="npt-recommendation-add" disabled={!purchase.canAdd} onClick={() => { if (purchase.add()) setAdded(true); }}><KidsIcon kind="bag" />{ar ? 'أضف للسلة' : 'Add to cart'}</button>;
 return <div><div className="npt-recommendation-product">{product.image ? <img src={product.image.src} alt="" /> : null}<div><a href={product.url}>{product.title}</a>{price}</div></div>{product.hasPersonalization || product.variants?.length ? <button type="button" className="npt-recommendation-add" onClick={() => setQuick(true)}>{ar ? 'اختر الخيارات' : 'Choose variations'}</button> : add}{added ? <span className="lib-sr-only" role="status">{ar ? 'تمت الإضافة للسلة' : 'Added to cart'}</span> : null}{quick ? <QuickView open onClose={() => setQuick(false)} title={product.title} images={[product.image, product.hoverImage].filter((image): image is NonNullable<typeof image> => Boolean(image))}><div className="npt-quick"><h2>{product.title}</h2>{price}<CardVariantPicker product={product} value={purchase.variantId} onChange={purchase.choose} atLimit={purchase.input !== null && !purchase.canAdd} />{!product.hasPersonalization ? add : null}<a href={product.url}>{ar ? 'تفاصيل المنتج' : 'Product details'}</a></div></QuickView> : null}</div>;
}
function CartIntroduction({ open }: { open: boolean }): ReactElement | null {
 const { store, apiOk } = useStore(); const { locale } = useLocale(); const { lines, totals } = useCart(); const { t } = useTranslation(); const ar = locale === 'ar'; const [position, setPosition] = useState(0);
 const scope = `${store.id}:${store.currency}:${locale}`;
 const query = useAsync(async () => { if (!open || !apiOk) return null; const response = await getProducts({ perPage: 12 }); return { scope, products: response.data.map(product => toProductCard(product, store.currency, store.currencyMultipliers[store.currency] ?? 1)) }; }, [open, apiOk, scope]);
 const products = query.data?.scope === scope ? query.data.products.filter(product => !product.soldOut) : !apiOk && previewOrDev() ? sampleNewest('nature-pets', locale).filter(product => !product.soldOut) : [];
 const index = products.length ? position % products.length : 0; const product = products[index];
 const threshold = shippingThreshold(store.shipping, totals.currency, store.currencyMultipliers); const free = cartHasFreeShippingOffer(lines); const shipping = (!lines.length || cartRequiresShipping(lines)) && (free || threshold !== undefined); const remaining = Math.max(0, (threshold ?? 0) - totals.subtotal);
 if (!shipping && !product) return null;
 return <section className="npt-cart-introduction" aria-label={ar ? 'اقتراحات السلة والشحن' : 'Cart suggestions and shipping'}>{shipping ? <div className="npt-cart-shipping"><p>{free ? ar ? 'شحن مجاني مع العرض، يُؤكد عند الدفع.' : 'Free shipping with the selected offer, confirmed at checkout.' : remaining > 0 ? t('cart.freeShippingProgress', { amount: formatMoney(remaining, totals.currency, locale) }) : t('cart.freeShippingReached')}</p><progress max="100" value={free || threshold === 0 ? 100 : threshold ? Math.min(100, totals.subtotal / threshold * 100) : 0} /></div> : null}{product ? <div className="npt-cart-recommendations">{products.length > 1 ? <button type="button" className="npt-recommendation-prev" aria-label={ar ? 'الاقتراح السابق' : 'Previous suggestion'} onClick={() => setPosition(value => (value - 1 + products.length) % products.length)}>‹</button> : null}<RecommendedProduct key={`${scope}:${product.id}`} product={product} />{products.length > 1 ? <button type="button" className="npt-recommendation-next" aria-label={ar ? 'الاقتراح التالي' : 'Next suggestion'} onClick={() => setPosition(value => value + 1)}>›</button> : null}</div> : null}</section>;
}
function NatureEmptyCart(): ReactElement { const ar = useLocale().locale === 'ar'; return <div className="npt-empty-cart"><svg viewBox="0 0 120 100" aria-hidden><path d="M18 42 60 26 102 42 60 60Z" fill="#E5E7EB" /><path d="M18 42 60 60 60 96 18 77Z" fill="#F1F2F5" /><path d="M60 60 102 42 102 77 60 96Z" fill="#D9DDE4" /><path d="M18 42 5 27 45 12 60 26Z" fill="#F7F7F9" /><path d="M60 26 76 12 116 27 102 42Z" fill="#ECEEF2" /><path d="M60 60 45 75 5 57 18 42Z" fill="#E9EBF0" /><path d="M60 60 77 75 116 57 102 42Z" fill="#F7F7F9" /></svg><h3>{ar ? 'السلة فارغة' : 'Empty cart'}</h3><p>{ar ? 'لا توجد منتجات في سلتك بعد.' : 'You have no items in your cart.'}</p></div>; }
export function NaturePetsCart({ open, close }: { open: boolean; close: () => void }): ReactElement {
 return <KidsCart open={open} close={close} className="npt-cart" hideShipping introduction={<CartIntroduction open={open} />} emptyContent={<NatureEmptyCart />} />;
}
