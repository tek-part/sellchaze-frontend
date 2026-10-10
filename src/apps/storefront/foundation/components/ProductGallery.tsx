/**
 * ProductGallery — PDP media: a main frame (with hover zoom) and a thumbnail rail. Selecting a
 * thumbnail swaps the main image; arrow keys move between thumbnails. Stacks below the main image on
 * mobile. Self-heals when images are missing (monogram fallback). See §32.7.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../../shared/utils/cn';
import type { ProductImage, ProductMediaModel } from '../../types/catalog';
import { ImageZoom } from './ImageZoom';
import { StoreImage } from './Image';

export interface ProductGalleryProps {
  images: ReadonlyArray<ProductImage>;
  media?: ReadonlyArray<ProductMediaModel>;
  title: string;
  initialSrc?: string;
  enableZoom?: boolean;
  className?: string;
}

export function ProductGallery(props: ProductGalleryProps): ReactElement {
  const { images, media, title, enableZoom = true, className } = props;
  const { t, i18n } = useTranslation();
  const items: ReadonlyArray<ProductMediaModel> = media?.length ? media : images.map((item) => ({ ...item, type: 'image' }));
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((item) => item.type === 'image' && item.src === props.initialSrc)));
  const [videoError, setVideoError] = useState('');
  const thumbsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const index = active < items.length ? active : 0;
  const current = items[index];
  const hasThumbs = items.length > 1;
  useEffect(() => {
    const video = videoRef.current;
    video?.load();
    return () => video?.pause();
  }, [current?.src]);

  const onThumbKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }
    event.preventDefault();
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    const next = forward ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    setActive(next);
    setVideoError('');
    (thumbsRef.current?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className={cn('sf-gallery', !hasThumbs && 'sf-gallery--single', className)}>
      {hasThumbs ? (
        <div ref={thumbsRef} className="sf-gallery__thumbs" role="tablist" aria-label={t('product.imagesOf', { title })} onKeyDown={onThumbKeyDown}>
          {items.map((image, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-current={i === index}
              aria-selected={i === index}
              aria-label={image.type === 'video' ? `${i18n.language.startsWith('ar') ? 'عرض الفيديو' : 'View video'} ${i + 1}` : t('product.viewImage', { n: i + 1 })}
              tabIndex={i === index ? 0 : -1}
              className="sf-gallery__thumb"
              onClick={() => { setActive(i); setVideoError(''); }}
            >
              {image.type === 'video' ? <span aria-hidden="true" className="sf-gallery__video-thumb">▶</span> : <StoreImage className="sf-gallery__thumb-img" src={image.src} alt="" />}
            </button>
          ))}
        </div>
      ) : null}

      <div className="sf-gallery__main">
        {current?.type === 'video' ? <><video ref={videoRef} key={current.src} className="sf-gallery__video" src={current.src} controls playsInline preload="metadata" aria-label={current.alt ?? title} onLoadedData={() => setVideoError('')} onError={(event) => setVideoError(event.currentTarget.error?.message || 'Unable to load video')} />{videoError ? <p role="status">{i18n.language.startsWith('ar') ? 'تعذّر تشغيل الفيديو في هذا المتصفح.' : 'This browser could not play the video.'} <a href={current.src} target="_blank" rel="noreferrer">{i18n.language.startsWith('ar') ? 'فتح الفيديو' : 'Open video'}</a></p> : null}</> : enableZoom ? (
          <ImageZoom src={current?.src} alt={current?.alt ?? title} eager />
        ) : (
          <StoreImage className="sf-zoom__img" src={current?.src} alt={current?.alt ?? title} eager />
        )}
      </div>
    </div>
  );
}
