/**
 * ProductGallery — PDP media: a main frame (with hover zoom) and a thumbnail rail. Selecting a
 * thumbnail swaps the main image; arrow keys move between thumbnails. Stacks below the main image on
 * mobile. Self-heals when images are missing (monogram fallback). See §32.7.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactElement } from 'react';
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
  mobileSlideshow?: boolean;
  desktopStack?: boolean;
}

export function ProductGallery(props: ProductGalleryProps): ReactElement {
  const { images, media, title, enableZoom = true, className } = props;
  const { t, i18n } = useTranslation();
  const galleryId = useId();
  const items: ReadonlyArray<ProductMediaModel> = media?.length ? media : images.map((item) => ({ ...item, type: 'image' }));
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((item) => item.type === 'image' && item.src === props.initialSrc)));
  const [videoError, setVideoError] = useState('');
  const thumbsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  const scrollStack = (next: number): void => {
    if (props.desktopStack && typeof window !== 'undefined' && window.matchMedia('(min-width:768px)').matches) {
      stackRef.current?.children[next]?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  };

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
    scrollStack(next);
    (thumbsRef.current?.children[next] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className={cn('sf-gallery', !hasThumbs && 'sf-gallery--single', props.desktopStack && 'sf-gallery--stacked', className)}>
      {hasThumbs ? (
        <div ref={thumbsRef} className="sf-gallery__thumbs" role={props.desktopStack ? 'group' : 'tablist'} aria-label={t('product.imagesOf', { title })} onKeyDown={onThumbKeyDown}>
          {items.map((image, i) => (
            <button
              key={i}
              type="button"
              role={props.desktopStack ? undefined : 'tab'}
              id={`${galleryId}-image-${i}`}
              aria-controls={`${galleryId}-panel`}
              aria-current={i === index}
              aria-selected={props.desktopStack ? undefined : i === index}
              aria-label={image.type === 'video' ? `${i18n.language.startsWith('ar') ? 'عرض الفيديو' : 'View video'} ${i + 1}` : t('product.viewImage', { n: i + 1 })}
              tabIndex={props.desktopStack || i === index ? 0 : -1}
              className="sf-gallery__thumb"
              onClick={() => { setActive(i); setVideoError(''); scrollStack(i); }}
            >
              {image.type === 'video' ? <span aria-hidden="true" className="sf-gallery__video-thumb">▶</span> : <StoreImage className="sf-gallery__thumb-img" src={image.src} alt="" sizes="96px" />}
            </button>
          ))}
        </div>
      ) : null}

      {props.desktopStack ? <div ref={stackRef} className="sf-gallery__stack">{items.map((item, i) => <div key={`${item.src}-${i}`} style={{ scrollMarginTop: '95px' }}>{item.type === 'video' ? <video src={item.src} controls playsInline preload="none" aria-label={item.alt ?? title} /> : enableZoom ? <ImageZoom src={item.src} alt={item.alt ?? title} eager={i === 0} /> : <StoreImage src={item.src} alt={item.alt ?? title} eager={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" />}</div>)}</div> : null}

      <div className="sf-gallery__main" id={`${galleryId}-panel`} {...(hasThumbs ? { role: props.desktopStack ? 'region' : 'tabpanel', 'aria-labelledby': `${galleryId}-image-${index}` } : {})}>
        {current?.type === 'video' ? <><video ref={videoRef} key={current.src} className="sf-gallery__video" src={current.src} controls playsInline preload="metadata" aria-label={current.alt ?? title} onLoadedData={() => setVideoError('')} onError={(event) => setVideoError(event.currentTarget.error?.message || 'Unable to load video')} />{videoError ? <p role="status">{i18n.language.startsWith('ar') ? 'تعذّر تشغيل الفيديو في هذا المتصفح.' : 'This browser could not play the video.'} <a href={current.src} target="_blank" rel="noreferrer">{i18n.language.startsWith('ar') ? 'فتح الفيديو' : 'Open video'}</a></p> : null}</> : enableZoom ? (
          <ImageZoom src={current?.src} alt={current?.alt ?? title} eager />
        ) : (
          <StoreImage className="sf-zoom__img" src={current?.src} alt={current?.alt ?? title} eager sizes="(min-width: 1024px) 50vw, 100vw" />
        )}
      </div>
      {props.mobileSlideshow && hasThumbs ? <div className="sf-gallery__mobile-controls" role="group" aria-label={t('product.imagesOf', { title })}>
        <button type="button" disabled={index === 0} aria-label={i18n.language.startsWith('ar') ? 'الوسائط السابقة' : 'Previous media'} onClick={() => { setActive(Math.max(0, index - 1)); setVideoError(''); }}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m14 5-7 7 7 7" /></svg></button>
        <output aria-live="polite" dir="ltr">{index + 1} / {items.length}</output>
        <button type="button" disabled={index === items.length - 1} aria-label={i18n.language.startsWith('ar') ? 'الوسائط التالية' : 'Next media'} onClick={() => { setActive(Math.min(items.length - 1, index + 1)); setVideoError(''); }}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m10 5 7 7-7 7" /></svg></button>
      </div> : null}
    </div>
  );
}
