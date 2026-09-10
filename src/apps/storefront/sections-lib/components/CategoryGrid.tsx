/**
 * category-grid — category tiles in a responsive grid: name over the image, tiles with the product
 * count below, or a plain text list with thumbnails.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS, spacingFields, tr, variants, variantSelect } from '../schema';
import { aspectClass, bool, gridStyle, num, spacingStyle, str, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibCategoryCard, LibEmpty, LibGrid, LibImage, LibSection } from '../primitives';
import { useLibT } from '../i18n';

export const CATEGORY_LAYOUTS = variants('layout', [
  { value: 'cards-overlay', label: 'Overlay cards', description: 'Name over the image.', icon: 'HiOutlinePhoto' },
  { value: 'tiles-with-count', label: 'Tiles', description: 'Image with name and count below.', icon: 'HiOutlineSquares2X2' },
  { value: 'list', label: 'List', description: 'Thumbnail rows with name and count.', icon: 'HiOutlineListBullet' },
]);

export const categoryGridSchema = defineSection({
  type: 'category-grid',
  label: 'Category grid',
  description: 'Category tiles with image and name.',
  category: 'categories',
  icon: 'HiOutlineViewColumns',
  variants: CATEGORY_LAYOUTS,
  settings: [
    fields.text('title', 'Title', tr('التصنيفات', 'Categories')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(CATEGORY_LAYOUTS, 'cards-overlay'),
    fields.select('columns', 'Columns', OPTIONS.columns(2, 6), '4'),
    fields.range('limit', 'Max categories', 8, 1, 24),
    fields.select('aspect', 'Image ratio', OPTIONS.aspect, 'square'),
    fields.toggle('show_count', 'Show product counts', true),
    fields.url('view_all_url', 'View-all link', '/categories'),
    ...spacingFields(),
  ],
});

export function CategoryGrid(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(categoryGridSchema, props.settings);
  const layout = useVariant(categoryGridSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const cats = data.categories(num(s, 'limit', 8));
  const title = str(s, 'title');
  if (cats.length === 0 && !title) return null;
  const columns = num(s, 'columns', 4);
  const showCount = bool(s, 'show_count', true);
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} style={spacingStyle(s)}>
      {cats.length === 0 ? (
        <LibEmpty message={t('emptyCategories')} />
      ) : layout === 'list' ? (
        <LibGrid style={gridStyle(Math.min(columns, 3), 1)} className="lib-cat-list">
          {cats.map((c) => (
            <a key={c.id} href={c.url} className="lib-cat-row">
              <span className="lib-cat-row__media"><LibImage src={c.image?.src} alt="" className="lib-cat-row__img" monogram={c.title.charAt(0)} /></span>
              <span className="lib-cat-row__text">
                <span className="lib-cat-row__name">{c.title}</span>
                {showCount && c.meta ? <span className="lib-cat-row__meta">{c.meta}</span> : null}
              </span>
              <span className="lib-cat-row__arrow" aria-hidden>→</span>
            </a>
          ))}
        </LibGrid>
      ) : (
        <LibGrid style={gridStyle(columns, 2)} className={cn(aspectClass(str(s, 'aspect', 'square')))}>
          {cats.map((c, i) => (
            <LibCategoryCard key={c.id} category={c} variant={layout === 'tiles-with-count' ? 'below' : 'overlay'} showCount={showCount} eager={i < columns} />
          ))}
        </LibGrid>
      )}
    </LibSection>
  );
}
