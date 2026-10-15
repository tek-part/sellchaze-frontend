import { useState, type ReactElement } from 'react';
import type { ProductCardModel } from '../../types/catalog';
import { CardVariantPicker, useCardPurchase } from '../../foundation/components/CardVariantPicker';
import { LibImage } from '../../sections-lib/primitives';
import { useLocaleCode } from '../../sections-lib/i18n';
import { formatMoney } from '../../utils/format';
import { PetIcon } from './icons';

export function PetCard({ product, compact = false }: { product: ProductCardModel; compact?: boolean }): ReactElement {
  const locale = useLocaleCode(); const ar = locale === 'ar'; const purchase = useCardPurchase(product); const [added, setAdded] = useState(false);
  const sale = purchase.compareAt !== undefined && purchase.compareAt > purchase.price;
  return <article className={`bpt-card${compact ? ' bpt-card--compact' : ''}`}><div className="bpt-card-media"><a href={product.url} tabIndex={-1} aria-hidden><LibImage src={product.image?.src} alt="" />{product.hoverImage ? <LibImage src={product.hoverImage.src} alt="" className="bpt-card-hover" /> : null}</a>{sale ? <span className="bpt-sale">{ar ? 'تخفيض' : 'Sale!'}</span> : null}{!product.hasPersonalization && !product.variants?.length && !product.soldOut ? <button className="bpt-card-quick" type="button" disabled={!purchase.canAdd} aria-label={`${ar ? 'أضف للسلة' : 'Add to cart'}: ${product.title}`} onClick={() => { if (purchase.add()) setAdded(true); }}><PetIcon kind="cart" /></button> : null}</div><div className="bpt-card-copy"><h3><a href={product.url}>{product.title}</a></h3><div className="bpt-price"><strong>{formatMoney(purchase.price, product.currency, locale)}</strong>{sale ? <del>{formatMoney(purchase.compareAt!, product.currency, locale)}</del> : null}</div>{product.soldOut ? <p>{ar ? 'نفد المخزون' : 'Sold out'}</p> : <CardVariantPicker product={product} value={purchase.variantId} onChange={purchase.choose} atLimit={purchase.input !== null && !purchase.canAdd} />}{product.variants?.length && !product.hasPersonalization && !product.soldOut ? <button type="button" className="bpt-option-add" disabled={!purchase.canAdd} onClick={() => { if (purchase.add()) setAdded(true); }}>{ar ? 'أضف للسلة' : 'Add to cart'}</button> : null}{added ? <span role="status" className="lib-sr-only">{ar ? 'تمت الإضافة للسلة' : 'Added to cart'}</span> : null}</div></article>;
}
