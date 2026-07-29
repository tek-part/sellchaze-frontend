/**
 * Rouge ProductGallery — large packshot with a soft-bloom frame + a thumbnail rail (vertical on
 * desktop, horizontal on mobile). Keyboard + click selection. Reads the shared ProductImage[].
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
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];

  return (
    <div className={cn('rge-gallery', className)}>
      {images.length > 1 ? (
        <div className="rge-gallery__thumbs" role="listbox" aria-label={t('product.imagesOf', { title })}>
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              className="rge-gallery__thumb"
              role="option"
              aria-selected={i === index}
              aria-current={i === index}
              aria-label={t('product.viewImage', { n: i + 1 })}
              onClick={() => setIndex(i)}
            >
              <StoreImage className="rge-gallery__thumb-img" src={img.src} alt="" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
      <div className="rge-gallery__main">
        <StoreImage className="rge-gallery__main-img" src={active?.src} alt={active?.alt ?? title} eager />
      </div>
    </div>
  );
}
