/**
 * Voltage StoreImage — lazy, async-decoded image with a technical fallback panel (SKU-style glyph)
 * when there's no src / it fails. Phase 10 layers responsive srcset.
 */
import { useState, type ImgHTMLAttributes, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface StoreImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  alt: string;
  eager?: boolean;
}
export function StoreImage(props: StoreImageProps): ReactElement {
  const { src, alt, eager = false, className, ...rest } = props;
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={cn('vlt-img-fallback', className)} role="img" aria-label={alt}>
        <span aria-hidden>◨</span>
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
