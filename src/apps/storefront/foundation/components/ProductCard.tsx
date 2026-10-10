/**
 * ProductCard — the grid product tile. 4:5 portrait, square imagery, 1px hairline (no shadow at
 * rest), serif name + serif price. Hover cross-fades to the second frame with a 1.03 zoom; optional
 * QuickAdd bar and wishlist toggle sit above the full-card link. One badge max. See §32.4.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../shared/utils/cn';
import type { ProductCardModel } from '../../types/catalog';
import { Badge } from './Badge';
import { Button } from './Button';
import { Price } from './Price';
import { Rating } from './Rating';
import { StoreImage } from './Image';
import { WishlistButton } from './WishlistButton';
import { CardVariantPicker } from './CardVariantPicker';
import { cardCartInput } from '../../utils/card-purchase';

export interface ProductCardProps {
  product: ProductCardModel;
  locale?: string;
  headingLevel?: 'h2' | 'h3';
  wishlisted?: boolean;
  onWishlistToggle?: (id: string) => void;
  showQuickAdd?: boolean;
  onQuickAdd?: (id: string, variantId?: string) => void;
  quickAddLoading?: boolean;
  className?: string;
}

export function ProductCard(props: ProductCardProps): ReactElement {
  const {
    product,
    locale,
    headingLevel: Heading = 'h3',
    wishlisted = false,
    onWishlistToggle,
    showQuickAdd = false,
    onQuickAdd,
    quickAddLoading = false,
    className,
  } = props;
  const { t } = useTranslation();
  const [selection, setSelection] = useState<{ productId: string; variantId: string }>();
  const variantId = selection?.productId === product.id ? selection.variantId : undefined;
  const variant = product.variants?.find((item) => item.id === variantId);
  const input = cardCartInput(product, variantId);

  return (
    <article className={cn('sf-product-card', className)}>
      <div className="sf-product-card__media">
        <StoreImage
          className="sf-product-card__img sf-product-card__img--primary"
          src={product.image?.src}
          srcSet={product.image?.srcSet}
          sizes={product.image?.sizes}
          alt={product.image?.alt ?? product.title}
        />
        {product.hoverImage ? (
          <StoreImage className="sf-product-card__img sf-product-card__img--hover" src={product.hoverImage.src} alt="" aria-hidden />
        ) : null}

        {product.badge ? (
          <span className="sf-product-card__badge">
            <Badge>{product.badge}</Badge>
          </span>
        ) : null}

        {onWishlistToggle ? (
          <span className="sf-product-card__wishlist">
            <WishlistButton active={wishlisted} onToggle={() => onWishlistToggle(product.id)} />
          </span>
        ) : null}

        {product.soldOut ? (
          <div className="sf-product-card__soldout">
            <Badge variant="solid">{t('product.soldOut')}</Badge>
          </div>
        ) : showQuickAdd && onQuickAdd ? (
          <div className="sf-product-card__quickadd">
            <CardVariantPicker product={product} value={variantId} onChange={(value) => setSelection({ productId: product.id, variantId: value })} />
            <Button size="sm" block disabled={!input} loading={quickAddLoading} onClick={() => { if (input) onQuickAdd(product.id, input.variantId); }}>
              {t('product.addToCart')}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="sf-product-card__body">
        {product.vendor ? <span className="sf-product-card__vendor">{product.vendor}</span> : null}
        <Heading className="sf-product-card__name">
          <a href={product.url} className="sf-product-card__link">
            {product.title}
          </a>
        </Heading>
        <div className="sf-product-card__meta">
          <Price
            amount={variant?.price ?? product.price}
            compareAt={variant?.compareAtPrice ?? product.compareAtPrice}
            currency={product.currency}
            locale={locale}
          />
          {typeof product.rating === 'number' ? (
            <Rating value={product.rating} count={product.reviewCount} showCount={false} />
          ) : null}
        </div>
      </div>
    </article>
  );
}
