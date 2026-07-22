/** Voltage CategoryCard — dark tile, mono meta label, cyan border on hover. */
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
    <a href={category.url} aria-label={category.title} className={cn('vlt-cat', className)}>
      <StoreImage className="vlt-cat__img" src={category.image?.src} alt="" aria-hidden eager={eager} />
      <span className="vlt-cat__overlay">
        {category.meta ? <span className="vlt-cat__meta">{category.meta}</span> : null}
        <span className="vlt-cat__label">{category.title}</span>
      </span>
    </a>
  );
}
