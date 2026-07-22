/**
 * CategoryCard — a route into the catalogue. Full-bleed image with an uppercase label over a scrim
 * and a thin gold rule that extends on hover. `text-only` drops the image for a quiet Bone tile.
 * See §32.4.
 */
import type { CSSProperties, ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { CategoryCardModel } from '../../../types/catalog';
import { StoreImage } from './Image';

export interface CategoryCardProps {
  category: CategoryCardModel;
  variant?: 'image-label' | 'text-only' | 'tall';
  eager?: boolean;
  className?: string;
}

export function CategoryCard(props: CategoryCardProps): ReactElement {
  const { category, variant = 'image-label', eager = false, className } = props;
  const style: CSSProperties | undefined = variant === 'tall' ? { aspectRatio: '3 / 5' } : undefined;

  return (
    <a
      href={category.url}
      aria-label={category.title}
      className={cn('sf-cat-card', variant === 'text-only' && 'sf-cat-card--text-only', className)}
      style={style}
    >
      {variant !== 'text-only' ? (
        <StoreImage className="sf-cat-card__img" src={category.image?.src} alt="" aria-hidden eager={eager} />
      ) : null}
      <span className="sf-cat-card__overlay">
        {category.meta ? <span className="sf-cat-card__meta">{category.meta}</span> : null}
        <span className="sf-cat-card__label">{category.title}</span>
        <span className="sf-cat-card__rule" aria-hidden />
      </span>
    </a>
  );
}
