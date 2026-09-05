/**
 * category-header — orients the category/collection page: breadcrumbs, title, description and an
 * optional banner (from settings or the category image). Reads `pageHeader` from the page data.
 */
import type { ReactElement } from 'react';
import type { SectionRenderProps } from '../../theme-engine/rendering';
import { cn } from '../../../../shared/utils/cn';
import { defineSection, fields, OPTIONS } from '../schema';
import { bool, str, useSectionSettings } from '../use-section';
import { useSectionData } from '../data';
import { LibImage } from '../primitives';

export const categoryHeaderSchema = defineSection({
  type: 'category-header',
  label: 'Category header',
  description: 'Title, breadcrumbs and banner of a category page.',
  category: 'layout',
  icon: 'HiOutlineTag',
  settings: [
    fields.text('title', 'Title override', ''),
    fields.toggle('show_description', 'Show description', true),
    fields.toggle('show_breadcrumbs', 'Show breadcrumbs', true),
    fields.select('banner_mode', 'Banner', [{ value: 'auto', label: 'Category image when available' }, { value: 'custom', label: 'Custom image' }, { value: 'none', label: 'No banner' }], 'auto'),
    fields.image('banner', 'Custom banner', ''),
    fields.select('align', 'Alignment', OPTIONS.align, 'start'),
  ],
});

export function CategoryHeader(props: SectionRenderProps): ReactElement | null {
  const s = useSectionSettings(categoryHeaderSchema, props.settings);
  const data = useSectionData(props.context);
  const header = data.pageHeader();
  const title = str(s, 'title') || header.title || '';
  if (!title) return null;
  const mode = str(s, 'banner_mode', 'auto');
  const banner = mode === 'none' ? '' : mode === 'custom' ? str(s, 'banner') : header.image ?? str(s, 'banner');
  const crumbs = bool(s, 'show_breadcrumbs', true) && header.breadcrumbs && header.breadcrumbs.length > 0 ? header.breadcrumbs : null;
  const align = str(s, 'align', 'start');

  const trail = crumbs ? (
    <nav className="lib-crumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((c, i) => (
          <li key={`${c.url}-${i}`}>
            {i < crumbs.length - 1 ? <a href={c.url}>{c.label}</a> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  ) : null;

  return (
    <section className={cn('lib-cat-header', banner && 'lib-cat-header--banner', `lib-cat-header--${align}`)}>
      {banner ? (
        <>
          <LibImage src={banner} alt="" className="lib-cat-header__img" eager />
          <div className="lib-cat-header__scrim" aria-hidden />
        </>
      ) : null}
      <div className="lib-container lib-cat-header__inner">
        {trail}
        <h1 className="lib-cat-header__title">{title}</h1>
        {bool(s, 'show_description', true) && header.description ? <p className="lib-cat-header__desc">{header.description}</p> : null}
      </div>
    </section>
  );
}
