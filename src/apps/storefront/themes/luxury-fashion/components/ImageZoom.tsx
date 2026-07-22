/**
 * ImageZoom — PDP hover/tap magnifier. On hover the image scales 2× with the transform-origin
 * following the pointer; tap toggles on touch. Disabled under reduced motion. Warm grade preserved
 * (never inverted). See §32.7.
 */
import { useRef, useState, type CSSProperties, type MouseEvent, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import { StoreImage } from './Image';

export interface ImageZoomProps {
  src?: string;
  alt: string;
  eager?: boolean;
  className?: string;
}

export function ImageZoom(props: ImageZoomProps): ReactElement {
  const { src, alt, eager = false, className } = props;
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState<CSSProperties>({ transformOrigin: 'center' });
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (event: MouseEvent<HTMLDivElement>): void => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin({ transformOrigin: `${x}% ${y}%` });
  };

  return (
    <div
      ref={ref}
      className={cn('sf-zoom', className)}
      data-zoomed={zoomed}
      onMouseEnter={() => setZoomed(true)}
      onMouseLeave={() => setZoomed(false)}
      onMouseMove={onMove}
      onClick={() => setZoomed((z) => !z)}
    >
      <StoreImage className="sf-zoom__img" src={src} alt={alt} eager={eager} style={origin} />
    </div>
  );
}
