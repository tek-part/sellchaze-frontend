/**
 * HorizontalProductCard — cart line, wishlist row or list-view result. Image inline-start (RTL flips
 * via logical props), details inline-end. Optional quantity stepper + remove (cart) or a custom
 * action node (wishlist "move to cart"). See §32.4.
 */
import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductCardModel } from '../../../types/catalog';
import { IconButton } from './IconButton';
import { IconClose } from './icons';
import { Price } from './Price';
import { QuantityStepper } from './QuantityStepper';
import { StoreImage } from './Image';

export interface HorizontalProductCardProps {
  product: ProductCardModel;
  locale?: string;
  /** Variant summary line, e.g. "Size M · Black". */
  attributes?: ReactNode;
  quantity?: number;
  onQuantityChange?: (next: number) => void;
  maxQuantity?: number;
  onRemove?: () => void;
  removeLabel?: string;
  /** Extra action (e.g. wishlist "Move to cart"). */
  action?: ReactNode;
  className?: string;
}

export function HorizontalProductCard(props: HorizontalProductCardProps): ReactElement {
  const { t } = useTranslation();
  const {
    product,
    locale,
    attributes,
    quantity,
    onQuantityChange,
    maxQuantity,
    onRemove,
    removeLabel = t('common.remove'),
    action,
    className,
  } = props;

  return (
    <article className={cn('sf-hcard', className)}>
      <a href={product.url} className="sf-hcard__media" aria-label={product.title} tabIndex={-1}>
        <StoreImage className="sf-hcard__img" src={product.image?.src} alt={product.image?.alt ?? product.title} />
      </a>
      <div className="sf-hcard__body">
        <div className="sf-hcard__row">
          <div>
            <a href={product.url} className="sf-product-card__link sf-hcard__name">
              {product.title}
            </a>
            {attributes ? <div className="sf-hcard__attrs">{attributes}</div> : null}
          </div>
          {onRemove ? (
            <IconButton label={removeLabel} onClick={onRemove}>
              <IconClose width={18} height={18} />
            </IconButton>
          ) : null}
        </div>
        <div className="sf-hcard__foot">
          {typeof quantity === 'number' && onQuantityChange ? (
            <QuantityStepper
              value={quantity}
              onChange={onQuantityChange}
              max={maxQuantity}
              compact
              label={t('pdp.quantityFor', { title: product.title })}
            />
          ) : (
            <span />
          )}
          <Price amount={product.price} compareAt={product.compareAtPrice} currency={product.currency} locale={locale} />
        </div>
        {action ? <div className="sf-hcard__action">{action}</div> : null}
      </div>
    </article>
  );
}
