/**
 * category-circles — the classic "shop by category" row of round thumbnails. Scrolls on mobile,
 * wraps into a grid on desktop (or always scrolls when `layout` is `scroll`).
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, spacingFields, tr } from '../schema';
import { bool, num, spacingStyle, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibCategoryCard, LibEmpty, LibSection } from '../primitives';
import { useLibT } from '../i18n';

export const categoryCirclesSchema = defineSection({
  type: 'category-circles',
  label: 'Category circles',
  description: 'Round category thumbnails in a scrollable row.',
  category: 'categories',
  icon: 'HiOutlineSquares2X2',
  settings: [
    fields.text('title', 'Title', tr('تسوق حسب التصنيف', 'Shop by category')),
    fields.text('subtitle', 'Subtitle', ''),
    fields.range('limit', 'Max categories', 10, 2, 24),
    fields.select('size', 'Circle size', [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }], 'md'),
    fields.select('layout', 'Layout', [{ value: 'scroll', label: 'Scroll row' }, { value: 'wrap', label: 'Wrap into rows' }], 'scroll'),
    fields.toggle('show_count', 'Show product counts', false),
    fields.url('view_all_url', 'View-all link', '/categories'),
    ...spacingFields(48),
  ],
});

export function CategoryCircles(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(categoryCirclesSchema, props.settings);
  const data = useSectionData(props.context);
  const t = useLibT();
  const cats = data.categories(num(s, 'limit', 10));
  const title = str(s, 'title');
  if (cats.length === 0 && !title) return null;
  return (
    <LibSection title={title} subtitle={str(s, 'subtitle')} viewAllHref={str(s, 'view_all_url')} style={spacingStyle(s)}>
      {cats.length === 0 ? (
        <LibEmpty message={t('emptyCategories')} />
      ) : (
        <div className={cn('lib-circles', `lib-circles--${str(s, 'size', 'md')}`, `lib-circles--${str(s, 'layout', 'scroll')}`)}>
          {cats.map((c, i) => (
            <LibCategoryCard key={c.id} category={c} variant="circle" showCount={bool(s, 'show_count')} eager={i < 4} />
          ))}
        </div>
      )}
    </LibSection>
  );
}
