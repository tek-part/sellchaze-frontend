/**
 * QuickView — preview a product in an overlay without leaving the grid. Composes a Modal around a
 * mini-gallery + the buy box (passed as children by the page, so the cart/variant logic lives in one
 * place). Not a PDP replacement. See §32.3.
 */
import type { ReactElement, ReactNode } from 'react';
import type { ProductImage } from '../../../types/catalog';
import { Modal } from './Modal';
import { ProductGallery } from './ProductGallery';

export interface QuickViewProps {
  open: boolean;
  onClose: () => void;
  title: string;
  images: ReadonlyArray<ProductImage>;
  /** Buy box: title, price, variant pickers, add-to-cart — supplied by the page. */
  children: ReactNode;
}

export function QuickView(props: QuickViewProps): ReactElement {
  const { open, onClose, title, images, children } = props;
  return (
    <Modal open={open} onClose={onClose} ariaLabel={title}>
      <div className="sf-quickview">
        <ProductGallery images={images} title={title} enableZoom={false} />
        <div className="sf-quickview__details">{children}</div>
      </div>
    </Modal>
  );
}
