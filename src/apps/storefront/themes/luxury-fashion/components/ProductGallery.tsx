/**
 * ProductGallery — PDP media: a main frame (with hover zoom) and a thumbnail rail. Selecting a
 * thumbnail swaps the main image; arrow keys move between thumbnails. Stacks below the main image on
 * mobile. Self-heals when images are missing (monogram fallback). See §32.7.
 */
import { useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../../shared/utils/cn';
import type { ProductImage } from '../../../types/catalog';
import { ImageZoom } from './ImageZoom';
import { StoreImage } from './Image';

export interface ProductGalleryProps {
  images: ReadonlyArray<ProductImage>;
  title: string;
  enableZoom?: boolean;
  className?: string;
}

export function ProductGallery(props: ProductGalleryProps): ReactElement {
  const { images, title, enableZoom = true, className } = props;
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const current = images[active] ?? images[0];
  const hasThumbs = images.length > 1;

  const onThumbKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    const next = forward ? (active + 1) % images.length : (active - 1 + images.length) % images.length;
    setActive(next);
    (thumbsRef.current?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className={cn('sf-gallery', !hasThumbs && 'sf-gallery--single', className)}>
      {hasThumbs ? (
        <div ref={thumbsRef} className="sf-gallery__thumbs" role="tablist" aria-label={t('product.imagesOf', { title })} onKeyDown={onThumbKeyDown}>
          {images.map((image, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-current={i === active}
              aria-label={t('product.viewImage', { n: i + 1 })}
              tabIndex={i === active ? 0 : -1}
              className="sf-gallery__thumb"
              onClick={() => setActive(i)}
            >
              <StoreImage className="sf-gallery__thumb-img" src={image.src} alt="" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="sf-gallery__main">
        {enableZoom ? (
          <ImageZoom src={current?.src} alt={current?.alt ?? title} eager />
        ) : (
          <StoreImage className="sf-zoom__img" src={current?.src} alt={current?.alt ?? title} eager />
        )}
      </div>
    </div>
  );
}
