/**
 * category-grid — category tiles in a responsive grid: image with the name overlaid or below.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr } from '../schema';
import { aspectClass, bool, gridStyle, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCategoryCard, LibEmpty, LibGrid, LibSection } from '../primitives';
import { useLibT } from '../i18n';

export const categoryGridSchema = defineSection({
  type: 'category-grid',
  label: 'Category grid',
  description: 'Category tiles with image and name.',
  category: 'categories',
  icon: 'HiOutlineViewColumns',
  settings: [
    fields.text('title', 'Title', tr('التصنيفات', 'Categories')),
    fields.text('subtitle', 'Subtitle', ''),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Max categories', 8, 1, 24),
    fields.select('style', 'Tile style', [{ value: 'overlay', label: 'Name over image' }, { value: 'below', label: 'Name below image' }], 'overlay'),
    fields.select('aspect', 'Image ratio', OPTIONS.aspect, 'square'),
    fields.toggle('show_count', 'Show product counts', true),
    fields.url('view_all_url', 'View-all link', '/categories'),
    ...spacingFields(),
  ],
});

export function CategoryGrid(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(categoryGridSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const cats = data.categories(num(s, 'limit', 8));
  const title = str(s, 'title');
  if (cats.length === 0 && !title) return null;
  const columns = num(s, 'columns', 4);
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} style={spacingStyle(s)}>
      {cats.length === 0 ? (
        <LibEmpty message={t('emptyCategories')} />
      ) : (
        <LibGrid style={gridStyle(columns, 2)} className={cn(aspectClass(str(s, 'aspect', 'square')))}>
          {cats.map((c, i) => (
            <LibCategoryCard key={c.id} category={c} variant={str(s, 'style') === 'below' ? 'below' : 'overlay'} showCount={bool(s, 'show_count', true)} eager={i < columns} />
          ))}
        </LibGrid>
      )}
    </LibSection>
  );
}
