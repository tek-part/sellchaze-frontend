import { useState, type ReactElement } from 'react';
import type { ProductCardModel } from '../../types/catalog';
import { CardVariantPicker, useCardPurchase } from '../../foundation/components/CardVariantPicker';
import { QuickView } from '../../foundation/components/QuickView';
import { LibImage } from '../../sections-lib/primitives';
import { useLocaleCode } from '../../sections-lib/i18n';
import { useWishlist } from '../../state/wishlist';
import { formatMoney } from '../../utils/format';
import { HypeIcon } from '../hype-perfumes/icons';

/** A color never silently chooses a size/style when several purchasable variants match. */
export function walletVariantForColor(product: ProductCardModel, color: string): string | undefined {
  const candidates = (product.variants ?? []).filter(variant => variant.available && (variant.availableStock === undefined || variant.availableStock > 0) && Object.values(variant.options ?? {}).some(value => value.toLowerCase() === color.toLowerCase()));
  return candidates.length === 1 ? candidates[0]?.id : undefined;
}
export function WalletCard({ product, compact = false }: { product: ProductCardModel; compact?: boolean }): ReactElement {
  const locale = useLocaleCode(); const ar = locale === 'ar'; const text = (a: string, e: string): string => ar ? a : e;
  const purchase = useCardPurchase(product); const wishlist = useWishlist(); const [quick, setQuick] = useState(false); const [added, setAdded] = useState(false);
  const discount = purchase.compareAt && purchase.compareAt > purchase.price ? Math.floor((1 - purchase.price / purchase.compareAt) * 100) : 0;
  const price = <div className="hyp-price">{discount ? <del>{formatMoney(purchase.compareAt!, product.currency, locale)}</del> : null}<strong>{formatMoney(purchase.price, product.currency, locale)}</strong></div>;
  // Options and personalization are chosen before adding; never silently add a parent SKU.
  const needsOptions = Boolean(product.variants?.length || product.hasPersonalization);
  const add = (): void => { if (purchase.add()) setAdded(true); };
  return <article className={`hyp-card${compact ? ' is-compact' : ''}`}>
    <div className="hyp-card-media"><a href={product.url} tabIndex={-1} aria-hidden><LibImage src={purchase.variant?.image?.src ?? product.image?.src} alt="" />{product.hoverImage ? <LibImage className="hyp-hover" src={product.hoverImage.src} alt="" /> : null}</a>
      {discount ? <span className="hyp-sale">{text('وفر', 'Save')} −{discount}%</span> : product.badge ? <span className="hyp-sale">{product.badge}</span> : null}
      {product.soldOut ? <span className="hyp-stock">{text('نفد المخزون', 'Sold out')}</span> : null}
      <div className="hyp-card-actions"><button type="button" aria-pressed={wishlist.has(product.id)} aria-label={`${text('المفضلة', 'Wishlist')}: ${product.title}`} onClick={() => wishlist.toggle(product.id)}><HypeIcon kind="heart" /></button><button type="button" aria-label={`${text('معاينة سريعة', 'Quick view')}: ${product.title}`} onClick={() => setQuick(true)}><HypeIcon kind="eye" /></button><button type="button" disabled={product.soldOut || (!needsOptions && !purchase.canAdd)} aria-label={`${needsOptions ? text('اختر الخيارات', 'Choose options') : text('أضف للسلة', 'Add to cart')}: ${product.title}`} onClick={() => needsOptions ? setQuick(true) : add()}><HypeIcon kind="bag" /></button></div>
    </div><div className="hyp-card-copy">{product.colors?.length ? <div className="ew-swatches" role="group" aria-label={`${text('الألوان', 'Colors')}: ${product.title}`}>{product.colors.map(color => product.variants?.length ? <button key={color.value} type="button" disabled={color.available === false} style={{ backgroundColor: color.color }} aria-label={`${text('اختر اللون', 'Choose color')}: ${color.label}`} onClick={() => { const id = walletVariantForColor(product, color.value); if (id) purchase.choose(id); setQuick(true); }} /> : <a key={color.value} href={product.url} style={{ backgroundColor: color.color }} aria-label={`${product.title}: ${color.label}`} />)}</div> : null}<h3><a href={product.url}>{product.title}</a></h3>{price}</div>
    {added ? <span role="status" className="lib-sr-only">{text('تمت الإضافة للسلة', 'Added to cart')}</span> : null}
    {quick ? <QuickView open onClose={() => setQuick(false)} title={product.title} images={[product.image, product.hoverImage].filter((image): image is NonNullable<typeof image> => Boolean(image))}><div className="hyp-quick"><h2>{product.title}</h2>{price}<CardVariantPicker product={product} value={purchase.variantId} onChange={purchase.choose} atLimit={purchase.input !== null && !purchase.canAdd} />{!product.hasPersonalization ? <button className="hyp-button" type="button" disabled={!purchase.canAdd} onClick={add}>{text('أضف للسلة', 'Add to cart')}</button> : null}<a href={product.url}>{text('تفاصيل المنتج', 'Product details')}</a>{added ? <p role="status">{text('تمت الإضافة للسلة', 'Added to cart')}</p> : null}</div></QuickView> : null}
  </article>;
}
