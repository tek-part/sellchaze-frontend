/** Voltage ProductGallery — thumbnail rail + main image; arrow-key thumb nav; stacks on mobile. */
import { useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
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
  const thumbsRef = useRef<HTMLDivElement>(null);
  const current = images[active] ?? images[0];
  const hasThumbs = images.length > 1;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    const next = forward ? (active + 1) % images.length : (active - 1 + images.length) % images.length;
    setActive(next);
    (thumbsRef.current?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className={cn('vlt-gallery', !hasThumbs && 'vlt-gallery--single', className)}>
      {hasThumbs ? (
        <div ref={thumbsRef} className="vlt-gallery__thumbs" role="tablist" aria-label={t('product.imagesOf', { title })} onKeyDown={onKeyDown}>
          {images.map((image, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-current={i === active}
              aria-label={t('product.viewImage', { n: i + 1 })}
              tabIndex={i === active ? 0 : -1}
              className="vlt-gallery__thumb"
              onClick={() => setActive(i)}
            >
              <StoreImage className="vlt-gallery__thumb-img" src={image.src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      <div className="vlt-gallery__main">
        <StoreImage className="vlt-gallery__main-img" src={current?.src} alt={current?.alt ?? title} eager />
      </div>
    </div>
  );
}
