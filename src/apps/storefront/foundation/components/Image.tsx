/**
 * StoreImage — lazy, async-decoded image with a graceful data-gap fallback: when there is no src
 * (or it fails to load) it renders a hairline placeholder with a serif monogram, so a missing photo
 * still looks composed. Phase 12 layers on responsive srcset/sizes.
 */
import { useState, type ImgHTMLAttributes, type ReactElement } from 'react';
import { cn } from '../../../../shared/utils/cn';
import { responsiveImage } from '../media/responsive';

export interface StoreImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  alt: string;
  /** Monogram/letter shown in the fallback (defaults to the first letter of alt). */
  monogram?: string;
  eager?: boolean;
}

export function StoreImage(props: StoreImageProps): ReactElement {
  const { src, alt, monogram, eager = false, className, srcSet, sizes, ...rest } = props;
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const letter = (monogram ?? (alt.trim().charAt(0) || '·')).toUpperCase();
    return (
      <span
        className={cn('sf-img-fallback', className)}
        {...(alt.trim() ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
      >
        <span aria-hidden>{letter}</span>
      </span>
    );
  }

  const responsive = srcSet ? { src, srcSet } : responsiveImage(src);
  return (
    <img
      src={responsive.src}
      srcSet={responsive.srcSet}
      sizes={responsive.srcSet ? sizes ?? '100vw' : sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
