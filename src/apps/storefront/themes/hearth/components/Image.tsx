/**
 * StoreImage — lazy, async-decoded image with a graceful data-gap fallback: when there is no src
 * (or it fails to load) it renders a warm monogram tile (cream surface + serif initial + leaf tint),
 * so a missing photo still looks composed and on-brand. Later phases layer responsive srcset/sizes.
 */
import { useState, type ImgHTMLAttributes, type ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';

export interface StoreImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  alt: string;
  /** Monogram/letter shown in the fallback (defaults to the first letter of alt). */
  monogram?: string;
  eager?: boolean;
}

export function StoreImage(props: StoreImageProps): ReactElement {
  const { src, alt, monogram, eager = false, className, ...rest } = props;
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const letter = (monogram ?? (alt.trim().charAt(0) || '·')).toUpperCase();
    return (
      <span className={cn('hh-img-fallback', className)} role="img" aria-label={alt}>
        <span aria-hidden>{letter}</span>
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
