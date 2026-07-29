/**
 * ProductGallery — big warm media viewer for the PDP: a large primary frame + a thumbnail rail.
 * Binds `ProductDetailModel.images`; falls back to the monogram tile when a store has no photos
 * (multi-image gallery is a data gap — never fabricated). Thumbs are labelled buttons; the active
 * one is `aria-current`.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductImage } from '../../../types/catalog';
import { StoreImage } from './Image';

export interface ProductGalleryProps {
  images: ReadonlyArray<ProductImage>;
  title: string;
  className?: string;
}

export function ProductGallery(props: ProductGalleryProps): ReactElement {
  const { images, title, className } = props;
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const list = images.length > 0 ? images : [{ src: '', alt: title }];
  const current = list[Math.min(active, list.length - 1)] ?? list[0];

  return (
    <div className={cn('hh-gallery', className)}>
      <div className="hh-gallery__main">
        <StoreImage className="hh-gallery__img" src={current?.src} alt={current?.alt ?? title} eager />
      </div>
      {list.length > 1 ? (
        <ul className="hh-gallery__thumbs" aria-label={t('product.productImages')}>
          {list.map((img, i) => (
            <li key={i}>
              <button
                type="button"
                className={cn('hh-gallery__thumb', i === active && 'hh-gallery__thumb--active')}
                onClick={() => setActive(i)}
                aria-label={t('product.viewImage', { n: i + 1 })}
                aria-current={i === active}
              >
                <StoreImage className="hh-gallery__thumb-img" src={img.src} alt={img.alt ?? `${title} ${i + 1}`} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
