/**
 * Voltage QuickView — a product peek in a Modal: image + title + price + short spec line + add-to-cart
 * (shared cart) and a link to the full PDP. Fed a ProductCardModel (list-level data). Voltage's own.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductCardModel } from '../../../types/catalog';
import { useCart } from '../../../state/cart';
import { useToast } from './toast/toast-context';
import { Modal } from './Modal';
import { Button } from './Button';
import { ButtonLink } from './ButtonLink';
import { Price } from './Price';
import { StoreImage } from './Image';

export interface QuickViewProps {
  product: ProductCardModel | null;
  open: boolean;
  onClose: () => void;
}

export function QuickView(props: QuickViewProps): ReactElement | null {
  const { product, open, onClose } = props;
  const { t } = useTranslation();
  const cart = useCart();
  const toast = useToast();
  if (!product) return null;

  const addToCart = (): void => {
    cart.add({
      id: `${product.id}:default`,
      productId: product.id,
      title: product.title,
      url: product.url,
      ...(product.image ? { image: product.image.src } : {}),
      price: product.price,
      currency: product.currency,
      quantity: 1,
    });
    toast.notify(t('product.addedToCartNamed', { title: product.title }), 'success');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={product.title} hideTitle size="lg" className="vlt-quickview">
      <div className="vlt-quickview__grid">
        <div className="vlt-quickview__media">
          <StoreImage className="vlt-quickview__img" src={product.image?.src} alt={product.image?.alt ?? product.title} eager />
        </div>
        <div className="vlt-quickview__body">
          {product.vendor ? <span className="vlt-quickview__vendor">{product.vendor}</span> : null}
          <h2 className="vlt-quickview__title">{product.title}</h2>
          <div className="vlt-quickview__price">
            <Price amount={product.price} {...(product.compareAtPrice ? { compareAt: product.compareAtPrice } : {})} currency={product.currency} />
          </div>
          <div className="vlt-quickview__actions">
            <Button onClick={addToCart} className="vlt-quickview__add">{t('product.addToCart')}</Button>
            <ButtonLink href={product.url} variant="ghost" onClick={onClose}>{t('product.viewFullDetails')}</ButtonLink>
          </div>
        </div>
      </div>
    </Modal>
  );
}
