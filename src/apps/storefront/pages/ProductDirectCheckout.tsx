import { useMemo, type ReactElement } from 'react';
import { getCartCatalog, type CheckoutItem } from '../api/storefront';
import { useAsync } from '../api/useAsync';
import { useStore } from '../state/store-context';
import { readDirectPurchase } from '../state/direct-purchase';
import { useLocale } from '../i18n/useLocale';
import { ButtonLink, Container, ErrorState, Section, Spinner } from '../foundation/components';
import { toProductDetail } from '../api/mappers';
import { variantAvailable } from '../state/variant-selection';
import { personalizationReady } from '../utils/personalization';
import ProductInlineCheckout from './ProductInlineCheckout';

export default function ProductDirectCheckout({ productId }: { productId: number }): ReactElement {
  const { store } = useStore(); const { locale } = useLocale(); const ar = locale === 'ar';
  const item = useMemo(() => readDirectPurchase(store.id, productId), [store.id, productId]);
  const query = useAsync(() => getCartCatalog([productId]), [store.id, productId, locale]);
  const raw = query.data?.store_id === Number(store.id) || String(query.data?.store_id) === store.id ? query.data?.data.find((row) => row.id === productId) : undefined;
  const product = raw ? toProductDetail(raw, store.baseCurrency) : undefined;
  const variant = product?.variants?.find((row) => row.id === String(item?.variant_id));
  const offer = product?.quantityOffers?.find((row) => row.id === item?.quantity_offer_id);
  const stock = product?.variants?.length ? variant?.availableStock : product?.availableStock;
  const ready = !!product && !!item && product.inStock !== false && (!product.variants?.length || !!variant && variantAvailable(variant))
    && (stock === undefined || item.quantity <= stock) && (product.orderMaxQuantity === undefined || item.quantity <= product.orderMaxQuantity)
    && (product.sharedMaxQuantity === undefined || item.quantity <= product.sharedMaxQuantity)
    && (!item.quantity_offer_id || !!offer && offer.version === item.quantity_offer_version && item.quantity % offer.quantity === 0 && offer.unitPrice <= (variant?.price ?? product.price))
    && personalizationReady(product.personalizationFields ?? [], item.personalization ?? {});
  const items = useMemo<ReadonlyArray<CheckoutItem>>(() => item ? [item] : [], [item]);
  return <Section><Container narrow>{query.loading ? <Spinner label={ar ? 'جارٍ تحميل المنتج…' : 'Loading product…'} /> : query.error ? <ErrorState title={ar ? 'تعذّر تحميل المنتج' : 'Unable to load product'} actions={<ButtonLink href="/products">{ar ? 'عرض المنتجات' : 'Browse products'}</ButtonLink>} /> : product ? <><h1>{product.title}</h1>{!ready ? <p role="status">{ar ? 'تغيّر الاختيار أو انتهت جلسته. راجع المنتج قبل الشراء.' : 'Your selection changed or expired. Review the product before buying.'}</p> : null}<ButtonLink href={product.url} variant="ghost">{ar ? 'تعديل الاختيار' : 'Edit selection'}</ButtonLink><ProductInlineCheckout key={product.id} productId={product.id} items={items} ready={ready} buttonText={product.productPreferences?.buy_now_text} /></> : <ErrorState title={ar ? 'المنتج غير متاح' : 'Product unavailable'} />}</Container></Section>;
}
