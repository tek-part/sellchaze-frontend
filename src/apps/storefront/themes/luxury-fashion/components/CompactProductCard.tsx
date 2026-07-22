/**
 * CompactProductCard — cross-sell / recently-viewed / related rail tile. Minimal chrome, one-line
 * serif name + price; optional best-seller rank ("01"). Built for scroll-snap rails. See §32.4.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { Price } from './Price';
import { StoreImage } from './Image';

export interface CompactProductCardProps {
  product: ProductCardModel;
  locale?: string;
  /** Best-seller rank overlay (1 → "01"). */
  rank?: number;
  className?: string;
}

export function CompactProductCard(props: CompactProductCardProps): ReactElement {
  const { product, locale, rank, className } = props;
  return (
    <article className={cn('sf-ccard', className)}>
      <div className="sf-ccard__media">
        <StoreImage className="sf-ccard__img" src={product.image?.src} alt={product.image?.alt ?? product.title} />
        {typeof rank === 'number' ? (
          <span className="sf-ccard__rank" aria-hidden>
            {String(rank).padStart(2, '0')}
          </span>
        ) : null}
      </div>
      <a href={product.url} className="sf-ccard__link sf-ccard__name">
        {product.title}
      </a>
      <Price amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} locale={locale} />
    </article>
  );
}
