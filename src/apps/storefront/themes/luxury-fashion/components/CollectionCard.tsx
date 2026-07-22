/**
 * CollectionCard — a curated collection / lookbook entry: serif title overlaid on a quiet zone with
 * a faint bottom scrim; image zooms gently on hover. See §32.4.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { CollectionCardModel } from '../../../types/catalog';
import { StoreImage } from './Image';

export interface CollectionCardProps {
  collection: CollectionCardModel;
  eager?: boolean;
  className?: string;
}

export function CollectionCard(props: CollectionCardProps): ReactElement {
  const { collection, eager = false, className } = props;
  return (
    <a href={collection.url} aria-label={collection.title} className={cn('sf-collection-card', className)}>
      <StoreImage className="sf-collection-card__img" src={collection.image?.src} alt="" aria-hidden eager={eager} />
      <span className="sf-collection-card__overlay">
        {collection.subtitle ? <span className="sf-collection-card__subtitle">{collection.subtitle}</span> : null}
        <span className="sf-collection-card__title">{collection.title}</span>
      </span>
    </a>
  );
}
