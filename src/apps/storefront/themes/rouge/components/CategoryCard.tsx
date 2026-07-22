/** Rouge CategoryCard — tall porcelain tile, gilt meta label, soft bloom + lift on hover. */
import type { ReactElement } from 'react';
import { cn } from '../../../../../shared/utils/cn';
import type { CategoryCardModel } from '../../../types/catalog';
import { StoreImage } from './Image';

export interface CategoryCardProps {
  category: CategoryCardModel;
  eager?: boolean;
  className?: string;
}
export function CategoryCard(props: CategoryCardProps): ReactElement {
  const { category, eager = false, className } = props;
  return (
    <a href={category.url} aria-label={category.title} className={cn('rge-cat', className)}>
      <StoreImage className="rge-cat__img" src={category.image?.src} alt="" aria-hidden eager={eager} />
      <span className="rge-cat__overlay">
        {category.meta ? <span className="rge-cat__meta">{category.meta}</span> : null}
        <span className="rge-cat__label">{category.title}</span>
      </span>
    </a>
  );
}
