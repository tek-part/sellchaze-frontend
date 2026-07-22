/**
 * CategoryCard — a warm "shop by room" tile: roomset image with a soft label overlay. Binds the
 * shared `CategoryCardModel`; `meta` (product count / eyebrow) renders only when present.
 */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { CategoryCardModel } from '../../../types/catalog';
import { StoreImage } from './Image';

export interface CategoryCardProps {
  category: CategoryCardModel;
  className?: string;
}

export function CategoryCard(props: CategoryCardProps): ReactElement {
  const { category, className } = props;
  return (
    <a href={category.url} className={cn('hh-category-card', className)}>
      <span className="hh-category-card__media">
        <StoreImage
          className="hh-category-card__img"
          src={category.image?.src}
          alt={category.image?.alt ?? category.title}
        />
      </span>
      <span className="hh-category-card__overlay">
        <span className="hh-category-card__title">{category.title}</span>
        {category.meta ? <span className="hh-category-card__meta">{category.meta}</span> : null}
      </span>
    </a>
  );
}
