/** Rouge CompactProductCard — a slim product tile for rails (recently viewed, related). */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { Price } from './Price';
import { StoreImage } from './Image';

export interface CompactProductCardProps {
  product: ProductCardModel;
  rank?: number;
  locale?: string;
  className?: string;
}

export function CompactProductCard(props: CompactProductCardProps): ReactElement {
  const { product, rank, locale, className } = props;
  return (
    <article className={cn('rge-ccard', className)}>
      <div className="rge-ccard__media">
        {rank ? <span className="rge-ccard__rank rge-num">{String(rank).padStart(2, '0')}</span> : null}
        <StoreImage className="rge-ccard__img" src={product.image?.src} alt={product.image?.alt ?? product.title} />
      </div>
      <div className="rge-ccard__body">
        <h3 className="rge-ccard__name">
          <a href={product.url} className="rge-ccard__link">{product.title}</a>
        </h3>
        <Price
          amount={product.price}
          {...(product.compareAtPrice ? { compareAt: product.compareAtPrice } : {})}
          currency={product.currency}
          locale={locale}
        />
      </div>
    </article>
  );
}
