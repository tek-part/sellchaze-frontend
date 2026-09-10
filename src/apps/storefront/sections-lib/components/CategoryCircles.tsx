/**
 * category-circles — the classic "shop by category" row of round thumbnails: a scrolling row, a
 * wrapped set of circles, or compact text chips.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, spacingFields, tr, variants, variantSelect } from '../schema';
import { bool, num, spacingStyle, str, useSectionSettings, useVariant } from '../use-section';
import { useSectionData } from '../data';
import { LibCategoryCard, LibEmpty, LibSection } from '../primitives';
import { useLibT } from '../i18n';

export const CIRCLE_LAYOUTS = variants('layout', [
  { value: 'scroll', label: 'Scroll row', description: 'Circles in one scrollable row.', icon: 'HiOutlineArrowsRightLeft' },
  { value: 'wrap', label: 'Wrap', description: 'Circles wrapped into centred rows.', icon: 'HiOutlineSquares2X2' },
  { value: 'chips', label: 'Chips', description: 'Compact pills with a small thumbnail.', icon: 'HiOutlineTag' },
]);

export const categoryCirclesSchema = defineSection({
  type: 'category-circles',
  label: 'Category circles',
  description: 'Round category thumbnails in a scrollable row.',
  category: 'categories',
  icon: 'HiOutlineSquares2X2',
  variants: CIRCLE_LAYOUTS,
  settings: [
    fields.text('title', 'Title', tr('تسوق حسب التصنيف', 'Shop by category')),
    fields.text('subtitle', 'Subtitle', ''),
    variantSelect(CIRCLE_LAYOUTS, 'scroll'),
    fields.range('limit', 'Max categories', 10, 2, 24),
    fields.select('size', 'Circle size', [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }], 'md'),
    fields.toggle('show_count', 'Show product counts', false),
    fields.url('view_all_url', 'View-all link', '/categories'),
    ...spacingFields(48),
  ],
});

export function CategoryCircles(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(categoryCirclesSchema, props.settings);
  const layout = useVariant(categoryCirclesSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const cats = data.categories(num(s, 'limit', 10));
  const title = str(s, 'title');
  if (cats.length === 0 && !title) return null;
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} style={spacingStyle(s)}>
      {cats.length === 0 ? (
        <LibEmpty message={t('emptyCategories')} />
      ) : layout === 'chips' ? (
        <div className="lib-chips">
          {cats.map((c) => (
            <a key={c.id} href={c.url} className="lib-chip">
              {c.image?.src ? <img src={c.image.src} alt="" className="lib-chip__img" loading="lazy" /> : null}
              <span className="lib-chip__name">{c.title}</span>
              {bool(s, 'show_count') && c.meta ? <span className="lib-chip__meta">{c.meta}</span> : null}
            </a>
          ))}
        </div>
      ) : (
        <div className={cn('lib-circles', `lib-circles--${str(s, 'size', 'md')}`, `lib-circles--${layout}`)}>
          {cats.map((c, i) => (
            <LibCategoryCard key={c.id} category={c} variant="circle" showCount={bool(s, 'show_count')} eager={i < 4} />
          ))}
        </div>
      )}
    </LibSection>
  );
}
