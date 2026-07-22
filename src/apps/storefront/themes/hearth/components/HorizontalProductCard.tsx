/**
 * HorizontalProductCard — a product as a row: media inline-start, details, price/actions inline-end.
 * Used in cart lines, wishlist rows, order lines and search list-view. Actions are injected by the
 * caller (qty stepper + remove for cart; move-to-cart for wishlist), so one row serves every flow.
 */
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { StoreImage } from './Image';
import { Price } from './Price';

export interface HorizontalProductCardProps {
  product: ProductCardModel;
  /** Secondary line under the title (variant summary, availability…). */
  meta?: ReactNode;
  /** Controls rendered inline-end (qty, remove, move-to-cart). */
  actions?: ReactNode;
  className?: string;
}

export function HorizontalProductCard(props: HorizontalProductCardProps): ReactElement {
  const { product, meta, actions, className } = props;
  return (
    <article className={cn('hh-hcard', className)}>
      <a href={product.url} className="hh-hcard__media" aria-label={product.title}>
        <StoreImage className="hh-hcard__img" src={product.image?.src} alt={product.image?.alt ?? product.title} />
      </a>
      <div className="hh-hcard__body">
        <div className="hh-hcard__info">
          <h3 className="hh-hcard__title">
            <a href={product.url}>{product.title}</a>
          </h3>
          {meta ? <div className="hh-hcard__meta">{meta}</div> : null}
          <Price
            value={product.price}
            {...(product.compareAtPrice !== undefined ? { compareAt: product.compareAtPrice } : {})}
            currency={product.currency}
            size="sm"
          />
        </div>
        {actions ? <div className="hh-hcard__actions">{actions}</div> : null}
      </div>
    </article>
  );
}
