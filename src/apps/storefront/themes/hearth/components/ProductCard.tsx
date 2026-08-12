/**
 * ProductCard — Hearth's warm product tile. Media (4:5, cream sweep) with an optional Tag + save
 * affordance, finish swatch dots, title, price and (when present) rating. Binds the shared
 * `ProductCardModel`; every optional field is gap-safe — rating/swatches/badge render only when the
 * data exists (never fabricated). The whole card is one link to the PDP; nested controls are
 * separate buttons (no nested anchors).
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { StoreImage } from './Image';
import { Price } from './Price';
import { Rating } from './Rating';
import { Tag, DiscountBadge } from './Badge';
import { WishlistButton } from './WishlistButton';

export interface ProductCardProps {
  product: ProductCardModel;
  /** Hide the wishlist control (e.g. inside the wishlist page itself). */
  hideSave?: boolean;
  /** Compact tile for dense rails. */
  compact?: boolean;
  className?: string;
}

const MAX_SWATCHES = 4;

export function ProductCard(props: ProductCardProps): ReactElement {
  const { product, hideSave = false, compact = false, className } = props;
  const { t } = useTranslation();
  const swatches = product.colors ?? [];
  const shown = swatches.slice(0, MAX_SWATCHES);
  const extra = swatches.length - shown.length;

  return (
    <article className={cn('hh-product-card', compact && 'hh-product-card--compact', className)}>
      <a href={product.url} className="hh-product-card__media" aria-label={product.title}>
        <StoreImage
          className="hh-product-card__img"
          src={product.image?.src}
          srcSet={product.image?.srcSet}
          sizes={product.image?.sizes}
          alt={product.image?.alt ?? product.title}
        />
        <div className="hh-product-card__tags">
          {product.badge ? <Tag tone="sage">{product.badge}</Tag> : null}
          <DiscountBadge price={product.price} {...(product.compareAtPrice !== undefined ? { compareAt: product.compareAtPrice } : {})} />
          {product.soldOut ? <Tag tone="neutral">{t('product.soldOut')}</Tag> : null}
        </div>
      </a>

      {hideSave ? null : (
        <WishlistButton className="hh-product-card__save" productId={product.id} title={product.title} />
      )}

      <div className="hh-product-card__body">
        {shown.length > 0 ? (
          <ul className="hh-product-card__swatches" aria-label={t('product.availableFinishes')}>
            {shown.map((s) => (
              <li
                key={s.value}
                className="hh-product-card__swatch"
                style={{ background: s.color }}
                title={s.label}
              >
                <span className="hh-visually-hidden">{s.label}</span>
              </li>
            ))}
            {extra > 0 ? <li className="hh-product-card__swatch-more">+{extra}</li> : null}
          </ul>
        ) : null}

        {product.vendor ? <p className="hh-product-card__vendor">{product.vendor}</p> : null}
        <h3 className="hh-product-card__title">
          <a href={product.url}>{product.title}</a>
        </h3>
        <div className="hh-product-card__meta">
          <Price
            value={product.price}
            {...(product.compareAtPrice !== undefined ? { compareAt: product.compareAtPrice } : {})}
            currency={product.currency}
            size="sm"
          />
          <Rating
            {...(product.rating !== undefined ? { value: product.rating } : {})}
            {...(product.reviewCount !== undefined ? { count: product.reviewCount } : {})}
            compact
          />
        </div>
      </div>
    </article>
  );
}
