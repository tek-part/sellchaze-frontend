/**
 * category-list / featured-categories — discovery entry points. CategoryCard grid + SectionHead.
 * Settings: title, columns, source, show_labels, shape. Self-hides when there are no categories.
 * §08 category-list / featured-categories.
 */
import type { CSSProperties, ReactElement } from 'react';
import type { SectionRenderProps } from '../../../theme-engine/rendering';
import { CategoryCard } from '../components/CategoryCard';
import { SectionShell } from './SectionShell';
import { categoriesFor } from './section-data';
import { option, range, text } from './section-settings';

export function CategoryListSection(props: SectionRenderProps): ReactElement | null {
  const { settings, context } = props;
  const title = text(settings, 'title');
  const columns = range(settings, 'columns', 3, 2, 5);
  const shape = option(settings, 'shape', ['image-label', 'text-only', 'tall'] as const, 'image-label');
  const categories = categoriesFor(context);

  if (categories.length === 0) return null;

  const style = {
    '--sf-cols': columns,
    '--sf-cols-lg': Math.min(columns, 3),
    '--sf-cols-md': 2,
    '--sf-cols-sm': 1,
  } as CSSProperties;

  return (
    <SectionShell title={title || undefined}>
      <div className="sf-grid" style={style}>
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} variant={shape} />
        ))}
      </div>
    </SectionShell>
  );
}
