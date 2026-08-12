/**
 * Rouge ProductCard — cosmetic-first tile: tall 4:5 packshot on a soft bloom, gilt badges, an optional
 * hover frame, a didone name + boutique price, a rating, and a preview row of shade dots. Reads the
 * shared ProductCardModel. Rouge's own markup + skin — no other theme reused.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { Badge } from './Badge';
import { Price } from './Price';
import { Rating } from './Rating';
import { ShadeDots } from './ShadeDots';
import { StoreImage } from './Image';

export interface ProductCardProps {
  product: ProductCardModel;
  locale?: string;
  headingLevel?: 'h2' | 'h3';
  /** Preview available shades as a dot row (merchant-toggled). */
  showShades?: boolean;
  eager?: boolean;
  className?: string;
}

export function ProductCard(props: ProductCardProps): ReactElement {
  const { product, locale, headingLevel: Heading = 'h3', showShades = true, eager = false, className } = props;
  const { t } = useTranslation();
  const onSale = typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  const shades = product.colors ?? [];
  return (
    <article className={cn('rge-card', className)}>
      <div className="rge-card__media">
        <StoreImage className="rge-card__img" src={product.image?.src} srcSet={product.image?.srcSet} sizes={product.image?.sizes} alt={product.image?.alt ?? product.title} eager={eager} />
        {product.hoverImage ? (
          <StoreImage className="rge-card__img rge-card__img--hover" src={product.hoverImage.src} alt="" aria-hidden />
        ) : null}
        <div className="rge-card__badges">
          {product.badge ? <Badge variant="new">{product.badge}</Badge> : null}
          {onSale ? <Badge variant="sale">{t('product.sale')}</Badge> : null}
        </div>
        {product.soldOut ? (
          <div className="rge-card__soldout">
            <Badge variant="outline">{t('product.soldOut')}</Badge>
          </div>
        ) : null}
      </div>
      <div className="rge-card__body">
        {product.vendor ? <span className="rge-card__vendor">{product.vendor}</span> : null}
        <Heading className="rge-card__name">
          <a href={product.url} className="rge-card__link">
            {product.title}
          </a>
        </Heading>
        {typeof product.rating === 'number' ? (
          <Rating value={product.rating} {...(product.reviewCount !== undefined ? { count: product.reviewCount } : {})} />
        ) : null}
        <div className="rge-card__foot">
          <Price
            amount={product.price}
            {...(product.compareAtPrice ? { compareAt: product.compareAtPrice } : {})}
            currency={product.currency}
            locale={locale}
          />
        </div>
        {showShades && shades.length > 0 ? (
          <ShadeDots className="rge-card__shades" shades={shades} readOnly max={5} />
        ) : null}
      </div>
    </article>
  );
}
